import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  if (!(await hasPermission(user.userId, "audit:view"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `
    SELECT *
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM audit_logs`
  );

  const total = parseInt(countRes.rows[0].count);

  return res.status(200).json({
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});