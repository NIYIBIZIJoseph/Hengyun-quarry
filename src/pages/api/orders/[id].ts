import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";
import { logAudit } from "@/lib/audit";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const { id } = req.query;
  const orderId = Number(id);

  if (!orderId) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  // ================= BRANCH CHECK =================
  const { whereClause, params } =
    enforceBranchIsolation(user, 'o', 'branch_id');

  const check = await pool.query(
    `
    SELECT o.*
    FROM orders o
    WHERE o.id = $${params.length + 1}
      AND o.deleted_at IS NULL
      ${whereClause}
    `,
    [...params, orderId]
  );

  if (!check.rows.length) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const existingOrder = check.rows[0];

  // ================= GET ORDER =================
  if (req.method === 'GET') {

    const allowed = await hasPermission(user.userId, 'order:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    return res.status(200).json({
      ...existingOrder,
      items: items.rows,
    });
  }

  // ================= UPDATE ORDER =================
  if (req.method === 'PUT') {

    const allowed = await hasPermission(user.userId, 'order:edit');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const {
      status,
      payment_status,
      assigned_worker_id,
      notes,
      delivery_date,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE orders
      SET
        status = COALESCE($1, status),
        payment_status = COALESCE($2, payment_status),
        assigned_worker_id = COALESCE($3, assigned_worker_id),
        notes = COALESCE($4, notes),
        delivery_date = COALESCE($5, delivery_date),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        status || null,
        payment_status || null,
        assigned_worker_id || null,
        notes || null,
        delivery_date || null,
        orderId,
      ]
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      targetType: "order",
      targetId: orderId,
      oldData: existingOrder,
      newData: result.rows[0],
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      order: result.rows[0],
    });
  }

  // ================= DELETE ORDER =================
  if (req.method === 'DELETE') {

    const allowed = await hasPermission(user.userId, 'order:delete');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    await pool.query(
      `
      UPDATE orders
      SET deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, orderId]
    );

    await logAudit({
      userId: user.userId,
      action: "DELETE",
      targetType: "order",
      targetId: orderId,
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});