import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

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

  try {
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

      const { full_name, status, role, branch_id, password } = req.body;

      // Start building the update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (full_name !== undefined && full_name !== "") {
        updates.push(`full_name = $${paramCount++}`);
        values.push(full_name);
      }

      if (status !== undefined && status !== "") {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (password !== undefined && password !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push(`password = $${paramCount++}`);
        values.push(hashedPassword);
      }

      if (role !== undefined && role !== "") {
        // Get role_id from role name
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
        if (roleRes.rows.length) {
          updates.push(`role_id = $${paramCount++}`);
          values.push(roleRes.rows[0].id);
        }
      }

      if (branch_id !== undefined) {
        updates.push(`branch_id = $${paramCount++}`);
        values.push(branch_id === null || branch_id === "" ? null : Number(branch_id));
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(id);
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

      const updated = await pool.query(query, values);

      await logAudit({
        userId: user.userId,
        action: "UPDATE_USER",
        targetType: "user",
        targetId: id,
        newData: req.body,
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
    
  } catch (error) {
    console.error("API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
});