import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const allowed = await hasPermission(user.userId, "dashboard:view");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  let branchFilter = "";
  let branchParams: any[] = [];

  if (user.role !== ROLES.SUPERADMIN && user.branchId) {
    branchFilter = " AND o.branch_id = $1";
    branchParams = [user.branchId];
  }

  const query = `
    SELECT DATE(o.created_at) as date,
           COALESCE(SUM(oi.subtotal), 0) as total
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('approved', 'delivered')
      AND o.created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND o.deleted_at IS NULL
      ${branchFilter}
    GROUP BY DATE(o.created_at)
    ORDER BY date ASC
  `;

  const result = await pool.query(query, branchParams);

  const today = new Date();
  const map: Record<string, number> = {};

  for (const row of result.rows) {
    const key = new Date(row.date).toISOString().split("T")[0];
    map[key] = Number(row.total);
  }

  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    data.push({ date: key, total: map[key] || 0 });
  }

  return res.status(200).json(data);
});