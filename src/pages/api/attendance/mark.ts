import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    if (req.method !== "POST") {

      res.setHeader(
        "Allow",
        ["POST"]
      );

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
        action,
        datetime,
      } = req.body;

      if (!worker_id || !action) {
        return res.status(400).json({
          error:
            "Missing worker_id or action",
        });
      }

      const now = datetime
        ? new Date(datetime)
        : new Date();

      const date =
        now.toISOString().slice(0, 10);

      const time =
        now.toTimeString().slice(0, 8);

      const workerResult =
        await pool.query(
          `
          SELECT full_name
          FROM workers
          WHERE id = $1
          `,
          [worker_id]
        );

      const workerName =
        workerResult.rows[0]
          ?.full_name || "Worker";

      // =========================================
      // CHECK-IN
      // =========================================
      if (action === "checkin") {

        const isLate =
          time > "08:00:00";

        await pool.query(
          `
          INSERT INTO attendance (
            worker_id,
            date,
            check_in,
            is_late,
            status,
            branch_id
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'present',
            $5
          )
          ON CONFLICT (
            worker_id,
            date
          )
          DO UPDATE SET
            check_in = EXCLUDED.check_in,
            is_late = EXCLUDED.is_late,
            status = 'present'
          `,
          [
            worker_id,
            date,
            time,
            isLate,
            user.branchId || null,
          ]
        );

        await createNotification({
          userId: user.userId,
          title:
            "Attendance Check-in",
          message:
            `${workerName} checked in at ${time}` +
            (isLate ? " (Late)" : ""),
          type: "attendance",
          priority:
            isLate
              ? "medium"
              : "low",
          link:
            "/dashboard/attendance/weekly",
        });
      }

      // =========================================
      // CHECK-OUT
      // =========================================
      else if (
        action === "checkout"
      ) {

        await pool.query(
          `
          UPDATE attendance
          SET check_out = $1
          WHERE worker_id = $2
            AND date = $3
          `,
          [
            time,
            worker_id,
            date,
          ]
        );

        await createNotification({
          userId: user.userId,
          title:
            "Attendance Check-out",
          message:
            `${workerName} checked out at ${time}`,
          type: "attendance",
          priority: "low",
          link:
            "/dashboard/attendance/weekly",
        });
      }

      else {
        return res.status(400).json({
          error: "Invalid action",
        });
      }

      return res.status(200).json({
        success: true,
        date,
        time,
      });

    } catch (err: any) {

      console.error(
        "ATTENDANCE MARK ERROR:",
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