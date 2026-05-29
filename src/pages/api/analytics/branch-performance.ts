import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
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

    const allowed = await hasPermission(
      user.userId,
      "analytics:view"
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    try {

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          "b",
          "id"
        );

      const query = `
        SELECT 
          b.name AS branch,

          COALESCE(
            SUM(o.total_amount),
            0
          ) AS revenue,

          ROUND(
            COALESCE(
              AVG(
                CASE
                  WHEN a.status = 'present'
                  THEN 1
                  ELSE 0
                END
              ),
              0
            ) * 100,
            1
          ) AS attendance,

          COUNT(DISTINCT o.id) AS orders

        FROM branches b

        LEFT JOIN orders o
          ON o.branch_id = b.id
          AND o.status IN ('approved', 'delivered')
          AND o.deleted_at IS NULL

        LEFT JOIN workers w
          ON w.branch_id = b.id
          AND w.deleted_at IS NULL

        LEFT JOIN attendance a
          ON a.worker_id = w.id
          AND a.date = CURRENT_DATE

        WHERE 1=1
        ${whereClause}

        GROUP BY b.id, b.name

        ORDER BY revenue DESC
      `;

      const result = await pool.query(query, params);

      return res.status(200).json(result.rows);

    } catch (err: any) {

      console.error(
        "BRANCH PERFORMANCE ERROR:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Internal server error",
      });
    }
  }
);