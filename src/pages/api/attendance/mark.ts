import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { createNotification, createNotificationForAllAdmins } from "@/lib/notifications";

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const allowed = await hasPermission(user.userId, "attendance:override");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const { worker_id, action, datetime } = req.body;

      if (!worker_id || !action) {
        return res.status(400).json({ error: "Missing worker_id or action" });
      }

      const now = datetime ? new Date(datetime) : new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toTimeString().slice(0, 8);

      const workerResult = await pool.query(
        `SELECT full_name, branch_id FROM workers WHERE id = $1`,
        [worker_id]
      );

      if (!workerResult.rows.length) {
        return res.status(404).json({ error: "Worker not found" });
      }

      const workerName = workerResult.rows[0]?.full_name || "Worker";
      const workerBranchId = workerResult.rows[0]?.branch_id;

      // =========================================
      // CHECK-IN
      // =========================================
      if (action === "checkin") {
        const isLate = time > "08:00:00";

        // Check if already checked in today
        const existing = await pool.query(
          `SELECT id, check_in FROM attendance WHERE worker_id = $1 AND date = $2`,
          [worker_id, date]
        );

        if (existing.rows.length && existing.rows[0].check_in) {
          return res.status(400).json({ error: "Already checked in today" });
        }

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
          VALUES ($1, $2, $3, $4, 'present', $5)
          ON CONFLICT (worker_id, date)
          DO UPDATE SET
            check_in = EXCLUDED.check_in,
            is_late = EXCLUDED.is_late,
            status = 'present'
          `,
          [worker_id, date, time, isLate, workerBranchId || user.branchId || null]
        );

        // ✅ NOTIFICATION: Worker checked in
        const checkInMessage = `${workerName} checked in at ${time}${isLate ? ' (LATE)' : ''}`;
        
        if (isLate) {
          await createNotificationForAllAdmins(
            "⏰ Worker Late",
            checkInMessage,
            "attendance",
            "medium",
            `/dashboard/attendance/weekly`
          );
        }

        await createNotification({
          userId: user.userId,
          title: "Attendance Check-in",
          message: checkInMessage,
          type: "attendance",
          priority: isLate ? "medium" : "low",
          link: "/dashboard/attendance/weekly",
        });

        return res.status(200).json({ success: true, date, time, isLate });
      }

      // =========================================
      // CHECK-OUT
      // =========================================
      else if (action === "checkout") {
        // Check if checked in today
        const existing = await pool.query(
          `SELECT check_in, check_out FROM attendance WHERE worker_id = $1 AND date = $2`,
          [worker_id, date]
        );

        if (!existing.rows.length || !existing.rows[0].check_in) {
          return res.status(400).json({ error: "Not checked in yet" });
        }

        if (existing.rows[0].check_out) {
          return res.status(400).json({ error: "Already checked out" });
        }

        await pool.query(
          `
          UPDATE attendance
          SET check_out = $1, updated_at = NOW()
          WHERE worker_id = $2 AND date = $3
          `,
          [time, worker_id, date]
        );

        // Calculate hours worked
        const checkInTime = existing.rows[0].check_in;
        const checkInHour = parseInt(checkInTime.split(':')[0]);
        const checkInMinute = parseInt(checkInTime.split(':')[1]);
        const checkOutHour = parseInt(time.split(':')[0]);
        const checkOutMinute = parseInt(time.split(':')[1]);
        
        let hoursWorked = (checkOutHour - checkInHour) + (checkOutMinute - checkInMinute) / 60;
        hoursWorked = Math.round(hoursWorked * 10) / 10;

        // ✅ NOTIFICATION: Worker checked out
        await createNotification({
          userId: user.userId,
          title: "Attendance Check-out",
          message: `${workerName} checked out at ${time} (Worked ${hoursWorked} hours)`,
          type: "attendance",
          priority: "low",
          link: "/dashboard/attendance/weekly",
        });

        return res.status(200).json({ success: true, date, time, hoursWorked });
      }

      else {
        return res.status(400).json({ error: "Invalid action" });
      }

    } catch (err: any) {
      console.error("ATTENDANCE MARK ERROR:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);