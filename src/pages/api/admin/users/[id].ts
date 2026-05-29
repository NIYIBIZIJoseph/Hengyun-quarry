import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  const id = Number(req.query.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const existing = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (!existing.rows.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const target = existing.rows[0];

  // ================= BRANCH SAFETY =================
  if (user.role !== ROLES.SUPERADMIN && target.branch_id !== user.branchId) {
    return res.status(403).json({ error: "Cross-branch blocked" });
  }

  // ================= GET =================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "user:view");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    return res.status(200).json(target);
  }

  // ================= UPDATE =================
  if (req.method === "PUT") {

    const allowed = await hasPermission(user.userId, "user:edit");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { full_name, status } = req.body;

    const updated = await pool.query(
      `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          status = COALESCE($2, status)
      WHERE id = $3
      RETURNING *
      `,
      [full_name ?? null, status ?? null, id]
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE_USER",
      targetType: "user",
      targetId: id,
      newData: { full_name, status },
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      user: updated.rows[0],
    });
  }

  // ================= DELETE =================
  if (req.method === "DELETE") {

    const allowed = await hasPermission(user.userId, "user:delete");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    await pool.query(
      `UPDATE users SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );

    await logAudit({
      userId: user.userId,
      action: "DELETE_USER",
      targetType: "user",
      targetId: id,
      ipAddress: req.headers["x-forwarded-for"] as string,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
});