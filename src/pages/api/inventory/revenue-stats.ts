// src/pages/api/inventory/revenue-stats.ts
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
    const { whereClause, params } = enforceBranchIsolation(user, "o", "branch_id");

    // ================= 1. TOTAL REVENUE (Approved + Delivered only) =================
    const totalRes = await pool.query(
      `
      SELECT COALESCE(SUM(o.total_amount), 0) AS total
      FROM orders o
      WHERE o.status IN ('approved', 'delivered')
        AND o.deleted_at IS NULL
        ${whereClause}
      `,
      params
    );

    const totalRevenue = Number(totalRes.rows[0]?.total || 0);

    // ================= 2. TOTAL ORDERS COUNT =================
    const ordersRes = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM orders o
      WHERE o.status IN ('approved', 'delivered')
        AND o.deleted_at IS NULL
        ${whereClause}
      `,
      params
    );

    const totalOrders = Number(ordersRes.rows[0]?.count || 0);

    // ================= 3. PER PRODUCT REVENUE =================
    const perProductRes = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o 
        ON o.id = oi.order_id 
        AND o.status IN ('approved', 'delivered')
        AND o.deleted_at IS NULL
        ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      `,
      params
    );

    // ================= 4. TOP PRODUCT =================
    const topProduct = perProductRes.rows[0] || null;

    return res.status(200).json({
      totalRevenue,
      totalOrders,
      topProduct,
      perProductRevenue: perProductRes.rows
    });

  } catch (error) {
    console.error("Revenue stats error:", error);
    return res.status(500).json({
      error: "Failed to load revenue statistics"
    });
  }
});