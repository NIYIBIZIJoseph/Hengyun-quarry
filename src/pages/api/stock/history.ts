import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const allowed = await hasPermission(user.userId, "inventory:view");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const { product_id, limit = 50 } = req.query;

  const { whereClause, params } =
    enforceBranchIsolation(user, "sm", "branch_id");

  let query = `
    SELECT sm.*, p.name AS product_name, u.full_name AS user_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.user_id = u.id
    WHERE 1=1 ${whereClause}
  `;

  const queryParams: any[] = [...params];
  let idx = queryParams.length + 1;

  if (product_id) {
    query += ` AND sm.product_id = $${idx++}`;
    queryParams.push(product_id);
  }

  query += ` ORDER BY sm.created_at DESC LIMIT $${idx++}`;
  queryParams.push(limit);

  const result = await pool.query(query, queryParams);

  return res.status(200).json(result.rows);
});