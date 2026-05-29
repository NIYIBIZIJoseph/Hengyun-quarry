import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    if (req.method !== "GET") {

      res.setHeader(
        "Allow",
        ["GET"]
      );

      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const allowed =
      await hasPermission(
        user.userId,
        "attendance:view"
      );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    try {

      const {
        year,
        month,
        department_id,
      } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          error:
            "year and month required",
        });
      }

      const startDate =
        `${year}-${String(month).padStart(2, "0")}-01`;

      const lastDay =
        new Date(
          Number(year),
          Number(month),
          0
        ).getDate();

      const endDate =
        `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      const {
        whereClause,
        params,
      } = enforceBranchIsolation(
        user,
        "w",
        "branch_id"
      );

      let query = `
        SELECT
          w.id,
          w.full_name AS name,
          d.name AS department,

          COUNT(
            CASE
              WHEN a.check_in IS NOT NULL
              AND a.is_late = false
              THEN 1
            END
          ) AS present,

          COUNT(
            CASE
              WHEN a.check_in IS NOT NULL
              AND a.is_late = true
              THEN 1
            END
          ) AS late,

          COUNT(
            CASE
              WHEN a.check_in IS NULL
              AND l.id IS NULL
              THEN 1
            END
          ) AS absent,

          COUNT(
            CASE
              WHEN l.id IS NOT NULL
              THEN 1
            END
          ) AS leave

        FROM workers w

        LEFT JOIN departments d
          ON w.department_id = d.id

        LEFT JOIN attendance a
          ON a.worker_id = w.id
          AND a.date BETWEEN $1 AND $2

        LEFT JOIN leave_requests l
          ON l.worker_id = w.id
          AND l.status = 'approved'
          AND (
            l.start_date BETWEEN $1 AND $2
            OR l.end_date BETWEEN $1 AND $2
          )

        WHERE w.is_active = true
        AND w.deleted_at IS NULL
        ${whereClause}
      `;

      const queryParams = [
        startDate,
        endDate,
        ...params,
      ];

      if (department_id) {

        query += `
          AND w.department_id = $${queryParams.length + 1}
        `;

        queryParams.push(
          department_id as string
        );
      }

      query += `
        GROUP BY
          w.id,
          w.full_name,
          d.name

        ORDER BY w.full_name
      `;

      const result =
        await pool.query(
          query,
          queryParams
        );

      const workersStats =
        result.rows.map(
          (row: any) => {

            const total =
              Number(row.present) +
              Number(row.late) +
              Number(row.absent);

            return {
              ...row,

              total_days:
                total +
                Number(row.leave),

              attendance_percentage:
                total > 0
                  ? (
                      (
                        (Number(row.present) +
                          Number(row.late)) /
                        total
                      ) * 100
                    ).toFixed(1)
                  : "0.0",
            };
          }
        );

      return res.status(200).json({
        year,
        month,
        workers: workersStats,
      });

    } catch (err: any) {

      console.error(
        "MONTHLY ATTENDANCE ERROR:",
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