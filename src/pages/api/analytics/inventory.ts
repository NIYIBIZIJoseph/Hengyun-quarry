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

    return requirePermission("inventory:view")(async () => {

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          "p",
          "branch_id"
        );

      const fastMovingRes = await pool.query(
        `
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        JOIN order_items oi ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at > NOW() - INTERVAL '30 days'
          AND o.status IN ('approved', 'delivered')
          AND p.deleted_at IS NULL
          ${whereClause}
        `,
        params
      );

      const slowMovingRes = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.stock_quantity > 0
          AND NOT EXISTS (
            SELECT 1
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.created_at > NOW() - INTERVAL '30 days'
          )
          AND p.deleted_at IS NULL
          ${whereClause}
        `,
        params
      );

      const deadStockRes = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.stock_quantity = 0
          AND p.deleted_at IS NULL
          ${whereClause}
        `,
        params
      );

      return res.status(200).json({
        fastMoving: Number(fastMovingRes.rows[0]?.count || 0),
        slowMoving: Number(slowMovingRes.rows[0]?.count || 0),
        deadStock: Number(deadStockRes.rows[0]?.count || 0),
      });

    })(req, res, user);
  }
);