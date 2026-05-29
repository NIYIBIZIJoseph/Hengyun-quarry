import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const allowed = await hasPermission(user.userId, "dashboard:view");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const result = await pool.query(
    `
    SELECT action, target_type, created_at
    FROM audit_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [user.userId]
  );

  const activities = result.rows.map((row) => ({
    action: row.action,
    target_type: row.target_type,
    created_at: row.created_at
      ? new Date(row.created_at).toISOString()
      : null,
  }));

  return res.status(200).json(activities);
});