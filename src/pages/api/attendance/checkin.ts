import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

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
      "attendance:checkin"
    );

    if (!allowed) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    try {

      const today = new Date()
        .toISOString()
        .split("T")[0];

      const existing = await pool.query(
        `
        SELECT id
        FROM attendance
        WHERE worker_id = $1
          AND date = $2
        `,
        [user.userId, today]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          error: "Already checked in",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO attendance
        (
          worker_id,
          date,
          check_in,
          status,
          created_at
        )
        VALUES ($1, $2, NOW(), 'present', NOW())
        RETURNING *
        `,
        [user.userId, today]
      );

      await logAudit({
        userId: user.userId,
        action: "CHECK_IN",
        targetType: "attendance",
        targetId: result.rows[0].id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json({
        success: true,
        attendance: result.rows[0],
      });

    } catch (err: any) {

      console.error("CHECKIN ERROR:", err);

      return res.status(500).json({
        error:
          err.message ||
          "Internal server error",
      });
    }
  }
);