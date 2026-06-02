import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

// PUBLIC API - No authentication required
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = $1`,
      ["maintenance_mode"]
    );

    return res.status(200).json({
      enabled: result.rows[0]?.value === "true",
      public: true
    });
  } catch (error) {
    console.error("Maintenance mode check error:", error);
    // Default to false on error so site still works
    return res.status(200).json({ enabled: false });
  }
}