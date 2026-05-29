import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  if (!(await hasPermission(user.userId, "settings:view"))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { table } = req.query;

  if (!table || typeof table !== "string") {
    return res.status(400).json({ error: "Table name required" });
  }

  const allowedTables = [
    "orders",
    "users",
    "workers",
    "attendance",
    "products",
    "support_tickets",
    "contact_messages"
  ];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: "Invalid table" });
  }

  const result = await pool.query(
    `SELECT * FROM ${table} WHERE deleted_at IS NULL ORDER BY id`
  );

  return res.status(200).json(result.rows);
});