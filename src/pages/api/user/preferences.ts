import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET =================
  if (req.method === "GET") {
    try {
      const result = await pool.query(
        `SELECT 
           locale, theme, compact_mode, notifications_enabled,
           language, sidebar_collapsed, default_dashboard,
           date_format, time_format, notifications_sound
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
          language: "en",
          sidebar_collapsed: false,
          default_dashboard: "/dashboard",
          date_format: "DD/MM/YYYY",
          time_format: "24h",
          notifications_sound: true,
        });
      }

      const row = result.rows[0];
      return res.status(200).json({
        locale: row.locale ?? "en",
        theme: row.theme ?? "light",
        compact_mode: row.compact_mode ?? false,
        notifications_enabled: row.notifications_enabled ?? true,
        language: row.language ?? "en",
        sidebar_collapsed: row.sidebar_collapsed ?? false,
        default_dashboard: row.default_dashboard ?? "/dashboard",
        date_format: row.date_format ?? "DD/MM/YYYY",
        time_format: row.time_format ?? "24h",
        notifications_sound: row.notifications_sound ?? true,
      });
    } catch (err: any) {
      console.error("GET preferences error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ================= PUT =================
  if (req.method === "PUT") {
    try {
      const b = req.body || {};

      // Read current values (or defaults)
      const cur = await pool.query(
        `SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1`,
        [user.userId]
      );
      const row = cur.rows[0] || {};

      const next = {
        locale: b.locale ?? row.locale ?? "en",
        theme: b.theme ?? row.theme ?? "light",
        compact_mode: b.compact_mode ?? row.compact_mode ?? false,
        notifications_enabled: b.notifications_enabled ?? row.notifications_enabled ?? true,
        language: b.language ?? row.language ?? "en",
        sidebar_collapsed: b.sidebar_collapsed ?? row.sidebar_collapsed ?? false,
        default_dashboard: b.default_dashboard ?? row.default_dashboard ?? "/dashboard",
        date_format: b.date_format ?? row.date_format ?? "DD/MM/YYYY",
        time_format: b.time_format ?? row.time_format ?? "24h",
        notifications_sound: b.notifications_sound ?? row.notifications_sound ?? true,
      };

      await pool.query(
        `
        INSERT INTO user_preferences 
          (user_id, locale, theme, compact_mode, notifications_enabled,
           language, sidebar_collapsed, default_dashboard,
           date_format, time_format, notifications_sound, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          locale = EXCLUDED.locale,
          theme = EXCLUDED.theme,
          compact_mode = EXCLUDED.compact_mode,
          notifications_enabled = EXCLUDED.notifications_enabled,
          language = EXCLUDED.language,
          sidebar_collapsed = EXCLUDED.sidebar_collapsed,
          default_dashboard = EXCLUDED.default_dashboard,
          date_format = EXCLUDED.date_format,
          time_format = EXCLUDED.time_format,
          notifications_sound = EXCLUDED.notifications_sound,
          updated_at = NOW()
        `,
        [
          user.userId,
          next.locale,
          next.theme,
          next.compact_mode,
          next.notifications_enabled,
          next.language,
          next.sidebar_collapsed,
          next.default_dashboard,
          next.date_format,
          next.time_format,
          next.notifications_sound,
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