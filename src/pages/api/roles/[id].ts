import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    const { id } = req.query;
    const roleId = Number(id);

    if (!roleId || isNaN(roleId)) {
      return res.status(400).json({
        error: "Invalid role ID",
      });
    }

    try {

      // ================= UPDATE ROLE PERMISSIONS =================
      if (req.method === "PUT") {

        const allowed = await hasPermission(
          user.userId,
          "roles:edit"
        );

        if (!allowed) {
          return res.status(403).json({
            error: "Forbidden",
          });
        }

        const { permissionIds } = req.body;

        if (!Array.isArray(permissionIds)) {
          return res.status(400).json({
            error: "permissionIds array required",
          });
        }

        const oldPerms = await pool.query(
          `
          SELECT permission_id
          FROM role_permissions
          WHERE role_id = $1
          `,
          [roleId]
        );

        const oldIds =
          oldPerms.rows.map(
            (r) => r.permission_id
          );

        await pool.query("BEGIN");

        await pool.query(
          `
          DELETE FROM role_permissions
          WHERE role_id = $1
          `,
          [roleId]
        );

        for (const permId of permissionIds) {
          await pool.query(
            `
            INSERT INTO role_permissions (
              role_id,
              permission_id
            ) VALUES ($1, $2)
            `,
            [roleId, permId]
          );
        }

        await pool.query("COMMIT");

        await logAudit({
          userId: user.userId,
          action: "UPDATE_ROLE_PERMISSIONS",
          targetType: "role",
          targetId: roleId,

          oldData: {
            permissionIds: oldIds,
          },

          newData: {
            permissionIds,
          },

          ipAddress:
            (req.headers[
              "x-forwarded-for"
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers["user-agent"],
        });

        return res.status(200).json({
          success: true,
        });
      }

      // ================= DELETE ROLE =================
      if (req.method === "DELETE") {

        const allowed = await hasPermission(
          user.userId,
          "roles:delete"
        );

        if (!allowed) {
          return res.status(403).json({
            error: "Forbidden",
          });
        }

        const usersRes = await pool.query(
          `
          SELECT COUNT(*)::int
          FROM users
          WHERE role_id = $1
          `,
          [roleId]
        );

        if (usersRes.rows[0].count > 0) {
          return res.status(409).json({
            error:
              "Cannot delete role with assigned users",
          });
        }

        await pool.query(
          `
          DELETE FROM role_permissions
          WHERE role_id = $1
          `,
          [roleId]
        );

        await pool.query(
          `
          DELETE FROM roles
          WHERE id = $1
          `,
          [roleId]
        );

        await logAudit({
          userId: user.userId,
          action: "DELETE_ROLE",
          targetType: "role",
          targetId: roleId,

          ipAddress:
            (req.headers[
              "x-forwarded-for"
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers["user-agent"],
        });

        return res.status(200).json({
          success: true,
        });
      }

      return res.status(405).end();

    } catch (err: any) {

      console.error("ROLE API ERROR:", err);

      return res.status(500).json({
        error:
          err.message ||
          "Internal server error",
      });
    }
  }
);