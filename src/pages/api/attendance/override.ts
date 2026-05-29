import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const allowed = await hasPermission(
      user.userId,
      "attendance:override"
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    try {

      const {
        worker_id,
        date,
        status,
        reason,
      } = req.body;

      if (
        !worker_id ||
        !date ||
        !status
      ) {
        return res.status(400).json({
          error:
            "Missing required fields",
        });
      }

      const localDate = String(
        date
      ).split("T")[0];

      const existing =
        await pool.query(
          `
          SELECT *
          FROM attendance
          WHERE worker_id = $1
            AND date::date = $2::date
            AND deleted_at IS NULL
          LIMIT 1
          `,
          [worker_id, localDate]
        );

      let result;

      if (existing.rows.length > 0) {

        result = await pool.query(
          `
          UPDATE attendance
          SET
            status = $1,
            manual_override = true,
            override_reason = $2,
            is_late = $3
          WHERE id = $4
          RETURNING *
          `,
          [
            status,
            reason ||
              "Manual override",
            status === "late",
            existing.rows[0].id,
          ]
        );

      } else {

        result = await pool.query(
          `
          INSERT INTO attendance (
            worker_id,
            date,
            status,
            is_late,
            manual_override,
            override_reason,
            branch_id
          )
          VALUES (
            $1,
            $2::date,
            $3,
            $4,
            true,
            $5,
            $6
          )
          RETURNING *
          `,
          [
            worker_id,
            localDate,
            status,
            status === "late",
            reason ||
              "Manual override",
            user.branchId || null,
          ]
        );
      }

      return res.status(200).json(
        result.rows[0]
      );

    } catch (err: any) {

      console.error(
        "OVERRIDE API ERROR:",
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