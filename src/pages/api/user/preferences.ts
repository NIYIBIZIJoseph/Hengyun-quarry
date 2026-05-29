import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET =================
  if (req.method === "GET") {

    const result = await pool.query(
      `SELECT key, value FROM user_preferences WHERE user_id = $1`,
      [user.userId]
    );

    const prefs: Record<string, string> = {};
    result.rows.forEach(r => {
      prefs[r.key] = r.value;
    });

    return res.status(200).json(prefs);
  }

  // ================= PUT =================
  if (req.method === "PUT") {

    const updates = req.body;

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Invalid data" });
    }

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== "string") continue;

      await pool.query(
        `
        INSERT INTO user_preferences (user_id, key, value, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [user.userId, key, value]
      );
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
});