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
      return res.status(405).end();
    }

    return requirePermission("analytics:view")(async () => {

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          "a",
          "branch_id"
        );

      const attendanceTrend = await pool.query(
        `
        SELECT a.date,
               COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
               COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
               COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
        FROM attendance a
        WHERE a.date > CURRENT_DATE - INTERVAL '7 days'
          AND a.deleted_at IS NULL
          ${whereClause}
        GROUP BY a.date
        ORDER BY a.date ASC
        `,
        params
      );

      return res.status(200).json({
        attendanceTrend: attendanceTrend.rows,
      });

    })(req, res, user);
  }
);