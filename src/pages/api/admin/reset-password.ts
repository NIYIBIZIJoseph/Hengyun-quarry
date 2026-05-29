import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // only admin-level users can reset passwords
  const isAllowed =
    user.role === ROLES.SUPERADMIN ||
    user.role === ROLES.ADMIN;

  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: "Missing data" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `UPDATE users SET password = $1, force_password_reset = true WHERE id = $2`,
    [hashed, userId]
  );

  await logAudit({
    userId: user.userId,
    action: "RESET_PASSWORD",
    targetType: "user",
    targetId: userId,
    ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  });

  return res.status(200).json({ success: true });
});