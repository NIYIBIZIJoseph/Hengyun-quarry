import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const isAllowed = user.role === ROLES.SUPERADMIN || user.role === ROLES.ADMIN;

  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = $1`,
      ["maintenance_mode"]
    );

    return res.status(200).json({
      enabled: result.rows[0]?.value === "true",
    });
  }

  if (req.method === "PUT") {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid value" });
    }

    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      ["maintenance_mode", enabled ? "true" : "false"]
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE_SYSTEM_SETTING",
      targetType: "maintenance_mode",
      newData: { enabled },
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true, enabled });
  }

  return res.status(405).end();
});