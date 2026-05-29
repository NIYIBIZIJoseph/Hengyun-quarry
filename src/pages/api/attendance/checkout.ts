import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthUser
  ) => {

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const allowed = await hasPermission(
      user.userId,
      "attendance:checkout"
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const { worker_id, datetime } = req.body;

    if (!worker_id) {
      return res.status(400).json({
        error: "worker_id required",
      });
    }

    const now = datetime
      ? new Date(datetime)
      : new Date();

    const date = now
      .toISOString()
      .slice(0, 10);

    const time = now
      .toTimeString()
      .slice(0, 8);

    try {

      const result = await pool.query(
        `
        UPDATE attendance
        SET check_out = $1
        WHERE worker_id = $2
          AND date = $3
          AND check_out IS NULL
        RETURNING id
        `,
        [time, worker_id, date]
      );

      if ((result.rowCount ?? 0) === 0) {
        return res.status(404).json({
          error: "No check-in found",
        });
      }

      await logAudit({
        userId: user.userId,
        action: "CHECK_OUT",
        targetType: "attendance",
        targetId: result.rows[0].id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json({
        success: true,
      });

    } catch (err: any) {

      console.error("CHECKOUT ERROR:", err);

      return res.status(500).json({
        error:
          err.message ||
          "Check-out failed",
      });
    }
  }
);