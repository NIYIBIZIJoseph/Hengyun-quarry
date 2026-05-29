import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { requirePermission } from "@/lib/middleware/requirePermission";
import { enforceBranchIsolation } from "@/lib/branch";
import { AuthUser } from "@/lib/auth";

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthUser
  ) => {

    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    return requirePermission("analytics:view")(async () => {

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          "o",
          "branch_id"
        );

      const revenueDaily = await pool.query(
        `
        SELECT DATE(o.created_at) as date,
               COALESCE(SUM(o.total_amount), 0) as revenue
        FROM orders o
        WHERE o.status IN ('approved', 'delivered')
          AND o.created_at >= CURRENT_DATE - INTERVAL '29 days'
          ${whereClause}
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
        `,
        params
      );

      const topProducts = await pool.query(
        `
        SELECT p.name,
               COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.status IN ('approved', 'delivered')
          AND o.deleted_at IS NULL
          ${whereClause}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
        `,
        params
      );

      return res.status(200).json({
        revenueDaily: revenueDaily.rows,
        topProducts: topProducts.rows,
      });

    })(req, res, user);
  }
);