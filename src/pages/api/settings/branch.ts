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

  // =====================================================
  // GET BRANCH SETTINGS
  // =====================================================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "settings:view");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    let branchId = user.branchId;

    const queryBranchId = req.query.branch_id;

    if (user.role === ROLES.SUPERADMIN && queryBranchId) {
      branchId = Number(queryBranchId);
    }

    if (!branchId) {
      return res.status(400).json({ error: "Branch required" });
    }

    const result = await pool.query(
      `
      SELECT key, value, description
      FROM branch_settings
      WHERE branch_id = $1
      ORDER BY key ASC
      `,
      [branchId]
    );

    return res.status(200).json(result.rows);
  }

  // =====================================================
  // UPSERT BRANCH SETTINGS
  // =====================================================
  if (req.method === "PUT") {

    const allowed = await hasPermission(user.userId, "settings:edit");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { branch_id, key, value } = req.body;

    let targetBranch = user.branchId;

    if (user.role === ROLES.SUPERADMIN && branch_id) {
      targetBranch = Number(branch_id);
    }

    if (!targetBranch || !key) {
      return res.status(400).json({ error: "Branch and key required" });
    }

    await pool.query(
      `
      INSERT INTO branch_settings (
        branch_id,
        key,
        value,
        updated_by,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW())

      ON CONFLICT (branch_id, key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at
      `,
      [targetBranch, key, value, user.userId]
    );

    await logAudit({
      userId: user.userId,
      action: "UPDATE_BRANCH_SETTING",
      targetType: "branch_setting",
      newData: { branch_id: targetBranch, key, value },
      ipAddress:
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
});