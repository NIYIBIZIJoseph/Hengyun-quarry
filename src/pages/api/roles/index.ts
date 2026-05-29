import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    try {

      // ================= GET ROLES =================
      if (req.method === "GET") {

        const allowed = await hasPermission(
          user.userId,
          "roles:view"
        );

        if (!allowed) {
          return res.status(403).json({
            error: "Forbidden",
          });
        }

        const rolesRes = await pool.query(
          `
          SELECT id, name
          FROM roles
          ORDER BY id
          `
        );

        const permsRes = await pool.query(
          `
          SELECT id, name
          FROM permissions
          ORDER BY name
          `
        );

        const rolePermsRes = await pool.query(
          `
          SELECT role_id, permission_id
          FROM role_permissions
          `
        );

        const roles = rolesRes.rows;
        const allPermissions = permsRes.rows;
        const rolePerms = rolePermsRes.rows;

        const rolesWithPerms = roles.map(
          (role) => ({
            ...role,
            permissions: rolePerms
              .filter(
                (rp) =>
                  rp.role_id === role.id
              )
              .map(
                (rp) =>
                  rp.permission_id
              ),
          })
        );

        return res.status(200).json({
          roles: rolesWithPerms,
          allPermissions,
        });
      }

      // ================= CREATE ROLE =================
      if (req.method === "POST") {

        const allowed = await hasPermission(
          user.userId,
          "roles:create"
        );

        if (!allowed) {
          return res.status(403).json({
            error: "Forbidden",
          });
        }

        const { name } = req.body;

        if (!name) {
          return res.status(400).json({
            error: "Role name required",
          });
        }

        const existing = await pool.query(
          `
          SELECT id
          FROM roles
          WHERE name = $1
          `,
          [name]
        );

        if (existing.rows.length > 0) {
          return res.status(409).json({
            error: "Role already exists",
          });
        }

        const result = await pool.query(
          `
          INSERT INTO roles (name)
          VALUES ($1)
          RETURNING id
          `,
          [name]
        );

        const roleId =
          result.rows[0].id;

        await logAudit({
          userId: user.userId,
          action: "CREATE_ROLE",
          targetType: "role",
          targetId: roleId,

          newData: { name },

          ipAddress:
            (req.headers[
              "x-forwarded-for"
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers["user-agent"],
        });

        return res.status(201).json({
          id: roleId,
          name,
        });
      }

      return res.status(405).end();

    } catch (err: any) {

      console.error("ROLES API ERROR:", err);

      return res.status(500).json({
        error:
          err.message ||
          "Internal server error",
      });
    }
  }
);