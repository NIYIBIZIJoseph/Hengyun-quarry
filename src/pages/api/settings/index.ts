import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  // =====================================================
  // GET SYSTEM SETTINGS
  // =====================================================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "settings:view");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `
      SELECT key, value, description
      FROM system_settings
      ORDER BY key ASC
      `
    );

    return res.status(200).json(result.rows);
  }

  // =====================================================
  // UPDATE SYSTEM SETTING
  // =====================================================
  if (req.method === "PUT") {

    const allowed = await hasPermission(user.userId, "settings:edit");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Key required" });
    }

    await pool.query(
      `
      UPDATE system_settings
      SET value = $1,
          updated_by = $2,
          updated_at = NOW()
      WHERE key = $3
      `,
      [value, user.userId, key]
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE_SYSTEM_SETTING",
      targetType: "system_setting",
      targetId: undefined,
      newData: { key, value },
      ipAddress:
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
});