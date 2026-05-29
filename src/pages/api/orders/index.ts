import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { enforceBranchIsolation } from "@/lib/branch";
import { createNotificationForAllAdmins } from "@/lib/notifications";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET ORDERS =================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "order:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { whereClause, params } =
      enforceBranchIsolation(user, "o", "branch_id");

    const result = await pool.query(
      `
      SELECT o.*, b.name AS branch_name
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.deleted_at IS NULL
      ${whereClause}
      ORDER BY o.id DESC
      `,
      params
    );

    return res.status(200).json(result.rows);
  }

  // ================= CREATE ORDER =================
  if (req.method === "POST") {

    const allowed = await hasPermission(user.userId, "order:create");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { client_name, items = [] } = req.body;

    if (!client_name || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const orderNumber = "ORD-" + Date.now();

    const orderResult = await pool.query(
      `
      INSERT INTO orders (order_number, client_name, status, branch_id)
      VALUES ($1, $2, 'pending', $3)
      RETURNING *
      `,
      [orderNumber, client_name, user.branchId || null]
    );

    const order = orderResult.rows[0];

    // NOTE: items handling placeholder (you likely need order_items table logic here)
    // TODO: insert items if your schema supports it

    await createNotificationForAllAdmins(
      "New Order Created",
      `Order ${orderNumber} created`,
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
  }

  // ================= DELETE ORDER =================
  if (req.method === "DELETE") {

    const allowed = await hasPermission(user.userId, "order:delete");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.query;

    if (!id) return res.status(400).json({ error: "Order ID required" });

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
  }

  return res.status(405).json({ error: "Method not allowed" });
});