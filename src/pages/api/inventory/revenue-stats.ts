import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allowed = await hasPermission(user.userId, "inventory:view");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  try {
    const { whereClause, params } =
      enforceBranchIsolation(user, "o", "branch_id");

    // ================= TOTAL REVENUE =================
    const totalRes = await pool.query(
      `
      SELECT COALESCE(SUM(oi.subtotal), 0) AS total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = 'approved'
      ${whereClause}
      `,
      params
    );

    const totalRevenue = Number(totalRes.rows[0]?.total || 0);

    // ================= PER PRODUCT =================
    const perProductRes = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o 
        ON o.id = oi.order_id 
        AND o.status = 'approved'
      ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      `,
      params
    );

    return res.status(200).json({
      totalRevenue,
      perProductRevenue: perProductRes.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load revenue statistics"
    });
  }
});