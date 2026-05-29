import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  let dbStatus = "ok";

  try {
    await pool.query("SELECT 1");
  } catch {
    dbStatus = "error";
  }

  return res.status(200).json({
    database: dbStatus,
    api: "ok",
    timestamp: new Date().toISOString(),
    authenticated: true,
    userRole: user.role,
  });
});