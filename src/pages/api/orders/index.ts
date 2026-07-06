// src/pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { enforceBranchIsolation } from "@/lib/branch";
import { createNotificationForAllAdmins } from "@/lib/notifications";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET ORDERS =================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "order:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    // ✅ Get ALL query parameters
    const { 
      search, 
      status, 
      payment, 
      branch, 
      startDate, 
      endDate 
    } = req.query;

    // ✅ Branch isolation
    const { whereClause, params } = enforceBranchIsolation(user, "o", "branch_id");
    
    // ✅ Build dynamic WHERE clause
    let query = `
      SELECT 
        o.*, 
        b.name AS branch_name,
        COALESCE(
          (SELECT STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name)
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = o.id),
          ''
        ) AS product_names,
        COALESCE(
          (SELECT COUNT(*)
           FROM order_items oi
           WHERE oi.order_id = o.id),
          0
        ) AS product_count
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.deleted_at IS NULL
      ${whereClause}
    `;

    const queryParams: any[] = [...params];
    let paramIndex = params.length + 1;

    // ✅ SEARCH filter
    if (search) {
      query += ` AND (
        o.order_number ILIKE $${paramIndex} OR 
        o.client_name ILIKE $${paramIndex} OR 
        o.client_phone ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // ✅ STATUS filter
    if (status && status !== 'all') {
      query += ` AND o.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // ✅ PAYMENT filter
    if (payment && payment !== 'all') {
      query += ` AND o.payment_status = $${paramIndex}`;
      queryParams.push(payment);
      paramIndex++;
    }

    // ✅ BRANCH filter (additional to branch isolation)
    if (branch && branch !== 'all') {
      // Only apply if user is superadmin or branch filter is different from isolation
      const branchId = parseInt(branch as string);
      if (user.role === ROLES.SUPERADMIN || branchId !== user.branchId) {
        query += ` AND o.branch_id = $${paramIndex}`;
        queryParams.push(branchId);
        paramIndex++;
      }
    }

    // ✅ DATE filter
    if (startDate) {
      query += ` AND o.created_at >= $${paramIndex}::timestamp`;
      queryParams.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND o.created_at <= $${paramIndex}::timestamp + INTERVAL '23:59:59'`;
      queryParams.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC`;

    console.log('Orders Query:', query);
    console.log('Query Params:', queryParams);

    try {
      const result = await pool.query(query, queryParams);
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  // ================= CREATE ORDER =================
  if (req.method === "POST") {

    const allowed = await hasPermission(user.userId, "order:create");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { client_name, client_phone, items = [], delivery_location, note, total_amount } = req.body;

    if (!client_name) {
      return res.status(400).json({ error: "Client name required" });
    }

    const orderNumber = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    
    let branchId = user.branchId;
    if (user.role === ROLES.SUPERADMIN && req.body.branch_id) {
      branchId = req.body.branch_id;
    }

    try {
      const orderResult = await pool.query(
        `
        INSERT INTO orders (
          order_number, 
          client_name, 
          client_phone, 
          status, 
          branch_id,
          delivery_location,
          note,
          total_amount,
          payment_status
        )
        VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, 'unpaid')
        RETURNING *
        `,
        [orderNumber, client_name, client_phone || null, branchId || null, delivery_location || null, note || null, total_amount || 0]
      );

      const order = orderResult.rows[0];

      // Insert order items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await pool.query(
            `
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [order.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
          );
        }
      }

      // ✅ NOTIFICATION: New order created
      await createNotificationForAllAdmins(
        "🛒 New Order Created",
        `Order ${orderNumber} from ${client_name} for ${(total_amount || 0).toLocaleString()} RWF`,
        "order",
        "medium",
        `/dashboard/orders/${order.id}`
      );

      await logAudit({
        userId: user.userId,
        action: "CREATE",
        targetType: "order",
        targetId: order.id,
        newData: order,
        ipAddress: req.headers["x-forwarded-for"] as string,
        userAgent: req.headers["user-agent"],
      });

      return res.status(201).json({ success: true, order });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  // ================= UPDATE ORDER STATUS =================
  if (req.method === "PUT") {

    const allowed = await hasPermission(user.userId, "order:edit");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { id, status, payment_status } = req.body;

    if (!id) return res.status(400).json({ error: "Order ID required" });

    try {
      // Get order details before update for notification
      const orderBefore = await pool.query(
        `SELECT order_number, client_name FROM orders WHERE id = $1`,
        [id]
      );

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (status) {
        updates.push(`status = $${idx++}`);
        values.push(status);
      }
      if (payment_status) {
        updates.push(`payment_status = $${idx++}`);
        values.push(payment_status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(id);

      const result = await pool.query(
        `
        UPDATE orders
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${idx}
        RETURNING *
        `,
        values
      );

      const order = result.rows[0];

      // ✅ NOTIFICATION: Order status changed
      if (status && status !== orderBefore.rows[0]?.status) {
        await createNotificationForAllAdmins(
          "📦 Order Status Updated",
          `Order ${orderBefore.rows[0]?.order_number} status changed to ${status}`,
          "order",
          status === 'delivered' ? 'high' : 'medium',
          `/dashboard/orders/${id}`
        );
      }

      await logAudit({
        userId: user.userId,
        action: "UPDATE",
        targetType: "order",
        targetId: id,
        newData: order,
        ipAddress: req.headers["x-forwarded-for"] as string,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json({ success: true, order });
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  // ================= DELETE ORDER =================
  if (req.method === "DELETE") {

    const allowed = await hasPermission(user.userId, "order:delete");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "Order ID required" });

    try {
      await pool.query(
        `
        UPDATE orders
        SET deleted_at = NOW(),
            deleted_by = $1
        WHERE id = $2
        `,
        [user.userId, id]
      );

      await logAudit({
        userId: user.userId,
        action: "DELETE",
        targetType: "order",
        targetId: Number(id),
        ipAddress: req.headers["x-forwarded-for"] as string,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({ error: 'Failed to delete order' });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
});