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
      "attendance:view"
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    try {

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          "a",
          "branch_id"
        );

      const query = `
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'present'
          ) AS present,

          COUNT(*) FILTER (
            WHERE status = 'late'
          ) AS late,

          COUNT(*) FILTER (
            WHERE status = 'absent'
          ) AS absent,

          COUNT(*) AS total

        FROM attendance a

        WHERE date = $1
          AND a.deleted_at IS NULL
          ${whereClause}
      `;

      const result = await pool.query(
        query,
        [today, ...params]
      );

      return res.status(200).json(
        result.rows[0]
      );

    } catch (err: any) {

      console.error(
        "DAILY ATTENDANCE ERROR:",
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