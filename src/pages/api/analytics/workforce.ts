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
          "w",
          "branch_id"
        );

      // Most Reliable Workers (most present days)
      const topReliable = await pool.query(
        `
        SELECT 
          w.full_name as name,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days
        FROM workers w
        LEFT JOIN attendance a 
          ON a.worker_id = w.id 
          AND a.date > NOW() - INTERVAL '30 days'
        WHERE w.deleted_at IS NULL 
          AND w.is_active = true
        ${whereClause}
        GROUP BY w.id, w.full_name
        ORDER BY present_days DESC
        LIMIT 5
        `,
        params
      );

      // Most Late Workers
      const mostLate = await pool.query(
        `
        SELECT 
          w.full_name as name,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count
        FROM workers w
        LEFT JOIN attendance a 
          ON a.worker_id = w.id 
          AND a.date > NOW() - INTERVAL '30 days'
        WHERE w.deleted_at IS NULL 
          AND w.is_active = true
        ${whereClause}
        GROUP BY w.id, w.full_name
        ORDER BY late_count DESC
        LIMIT 5
        `
      );

      // Most Absent Workers
      const mostAbsent = await pool.query(
        `
        SELECT 
          w.full_name as name,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count
        FROM workers w
        LEFT JOIN attendance a 
          ON a.worker_id = w.id 
          AND a.date > NOW() - INTERVAL '30 days'
        WHERE w.deleted_at IS NULL 
          AND w.is_active = true
        ${whereClause}
        GROUP BY w.id, w.full_name
        ORDER BY absent_count DESC
        LIMIT 5
        `
      );

      return res.status(200).json({
        topReliable: topReliable.rows,
        mostLate: mostLate.rows,
        mostAbsent: mostAbsent.rows
      });

    })(req, res, user);
  }
);