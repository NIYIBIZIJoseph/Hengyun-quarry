// src/pages/api/orders/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;
  const orderId = parseInt(id as string);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  // ================= GET ORDER DETAILS =================
  if (req.method === "GET") {
    const allowed = await hasPermission(user.userId, "order:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    try {
      const result = await pool.query(
        `
        SELECT 
          o.*, 
          b.name AS branch_name,
          COALESCE(
            (SELECT JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', p.id,
                 'name', p.name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             )
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = o.id),
            '[]'::json
          ) AS items
        FROM orders o
        LEFT JOIN branches b ON o.branch_id = b.id
        WHERE o.id = $1 AND o.deleted_at IS NULL
        `,
        [orderId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ error: "Failed to fetch order" });
    }
  }

  // ================= UPDATE ORDER =================
  if (req.method === "PUT") {
    const allowed = await hasPermission(user.userId, "order:edit");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { status, payment_status, admin_notes } = req.body;

    // ✅ Get current order status before update
    const currentOrder = await pool.query(
      `SELECT status FROM orders WHERE id = $1 AND deleted_at IS NULL`,
      [orderId]
    );

    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const oldStatus = currentOrder.rows[0].status;

    // ✅ Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (payment_status !== undefined) {
      updates.push(`payment_status = $${idx++}`);
      values.push(payment_status);
    }
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${idx++}`);
      values.push(admin_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // ✅ Get order items (for stock updates)
    const orderItems = await pool.query(
      `
      SELECT oi.product_id, oi.quantity, p.stock_quantity as current_stock
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      `,
      [orderId]
    );

    // ✅ STOCK MANAGEMENT: If order is being approved
    const isApproving = status && (status === 'approved' || status === 'delivered') && 
                        oldStatus !== 'approved' && oldStatus !== 'delivered';
    
    if (isApproving) {
      // Check stock availability
      for (const item of orderItems.rows) {
        if (item.current_stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for product. Available: ${item.current_stock}, Required: ${item.quantity}` 
          });
        }
      }

      // Update stock for each item
      for (const item of orderItems.rows) {
        const oldStock = item.current_stock;
        const newStock = oldStock - item.quantity;

        // Update product stock
        await pool.query(
          `
          UPDATE products 
          SET stock_quantity = $1
          WHERE id = $2
          `,
          [newStock, item.product_id]
        );

        // Log stock movement
        await pool.query(
          `
          INSERT INTO stock_logs (
            product_id, 
            changed_by, 
            old_quantity, 
            new_quantity, 
            reason, 
            movement_type
          )
          VALUES ($1, $2, $3, $4, $5, 'order')
          `,
          [item.product_id, user.userId, oldStock, newStock, `Order #${orderId} approved`]
        );
      }
    }

    // ✅ STOCK MANAGEMENT: If order is being cancelled (from approved/delivered)
    const isCancelling = status === 'cancelled' && (oldStatus === 'approved' || oldStatus === 'delivered');
    
    if (isCancelling) {
      // Restore stock for each item
      for (const item of orderItems.rows) {
        const oldStock = item.current_stock;
        const newStock = oldStock + item.quantity;

        // Update product stock
        await pool.query(
          `
          UPDATE products 
          SET stock_quantity = $1
          WHERE id = $2
          `,
          [newStock, item.product_id]
        );

        // Log stock movement
        await pool.query(
          `
          INSERT INTO stock_logs (
            product_id, 
            changed_by, 
            old_quantity, 
            new_quantity, 
            reason, 
            movement_type
          )
          VALUES ($1, $2, $3, $4, $5, 'order_cancelled')
          `,
          [item.product_id, user.userId, oldStock, newStock, `Order #${orderId} cancelled`]
        );
      }
    }

    // ✅ Update order
    values.push(orderId);
    const query = `
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    await logAudit({
      userId: user.userId,
      action: "UPDATE_ORDER",
      targetType: "order",
      targetId: orderId,
      newData: result.rows[0],
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ 
      success: true, 
      order: result.rows[0] 
    });
  }

  // ================= DELETE ORDER =================
  if (req.method === "DELETE") {
    const allowed = await hasPermission(user.userId, "order:delete");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    try {
      // ✅ Check if order is approved - if so, restore stock before deleting
      const orderToDelete = await pool.query(
        `SELECT status FROM orders WHERE id = $1 AND deleted_at IS NULL`,
        [orderId]
      );

      if (orderToDelete.rows.length > 0 && 
          (orderToDelete.rows[0].status === 'approved' || orderToDelete.rows[0].status === 'delivered')) {
        
        // Get order items
        const items = await pool.query(
          `
          SELECT oi.product_id, oi.quantity, p.stock_quantity as current_stock
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = $1
          `,
          [orderId]
        );

        // Restore stock
        for (const item of items.rows) {
          const newStock = item.current_stock + item.quantity;
          await pool.query(
            `
            UPDATE products 
            SET stock_quantity = $1
            WHERE id = $2
            `,
            [newStock, item.product_id]
          );
        }
      }

      await pool.query(
        `
        UPDATE orders
        SET deleted_at = NOW(), deleted_by = $1
        WHERE id = $2
        `,
        [user.userId, orderId]
      );

      await logAudit({
        userId: user.userId,
        action: "DELETE_ORDER",
        targetType: "order",
        targetId: orderId,
        ipAddress: req.headers["x-forwarded-for"] as string,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      return res.status(500).json({ error: "Failed to delete order" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
});