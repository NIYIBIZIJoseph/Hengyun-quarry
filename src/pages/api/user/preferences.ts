import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET =================
  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT locale, theme, compact_mode, notifications_enabled
         FROM user_preferences
         WHERE user_id = $1
         LIMIT 1`,
        [user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          locale: "en",
          theme: "light",
          compact_mode: false,
          notifications_enabled: true,
        });
      }

      const row = result.rows[0];
      return res.status(200).json({
        locale: row.locale || "en",
        theme: row.theme || "light",
        compact_mode: row.compact_mode ?? false,
        notifications_enabled: row.notifications_enabled ?? true,
      });
    } catch (err: any) {
      console.error("GET preferences error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ================= PUT =================
  if (req.method === "PUT") {
    try {
      const { locale, theme, compact_mode, notifications_enabled } = req.body;

      await pool.query(
        `
        INSERT INTO user_preferences (user_id, locale, theme, compact_mode, notifications_enabled, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          locale = COALESCE(EXCLUDED.locale, user_preferences.locale),
          theme = COALESCE(EXCLUDED.theme, user_preferences.theme),
          compact_mode = COALESCE(EXCLUDED.compact_mode, user_preferences.compact_mode),
          notifications_enabled = COALESCE(EXCLUDED.notifications_enabled, user_preferences.notifications_enabled),
          updated_at = NOW()
        `,
        [
          user.userId,
          locale ?? null,
          theme ?? null,
          compact_mode ?? null,
          notifications_enabled ?? null,
        ]
      );

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("PUT preferences error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
});