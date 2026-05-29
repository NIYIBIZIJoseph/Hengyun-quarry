import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { hasPermission } from "@/lib/permissions";

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const allowed = await hasPermission(user.userId, "roles:view");

  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    const roles = await pool.query("SELECT id, name FROM roles ORDER BY id");
    const permissions = await pool.query("SELECT id, name FROM permissions ORDER BY name");
    const rolePerms = await pool.query("SELECT role_id, permission_id FROM role_permissions");

    const data = roles.rows.map(role => ({
      ...role,
      permissions: permissions.rows
        .filter(p =>
          rolePerms.rows.some(rp =>
            rp.role_id === role.id && rp.permission_id === p.id
          )
        )
        .map(p => p.name),
    }));

    return res.status(200).json(data);
  }

  return res.status(405).end();
});