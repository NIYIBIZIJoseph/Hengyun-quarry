import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import os from "os";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= METHOD GUARD =================
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ================= PERMISSION CHECK =================
  const allowed =
    user.role === ROLES.SUPERADMIN ||
    (await hasPermission(user.userId, "admin:controls"));

  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {

    const dbVersionRes = await pool.query(`SELECT version()`);
    const dbVersion = dbVersionRes.rows[0]?.version;

    const info = {
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      databaseVersion: dbVersion,
      environment: process.env.NODE_ENV || "development",
    };

    return res.status(200).json(info);

  } catch (err: any) {
    console.error("SYSTEM INFO ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch system info",
    });
  }
});