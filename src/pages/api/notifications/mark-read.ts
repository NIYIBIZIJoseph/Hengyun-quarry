import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, all } = req.body;

  try {

    // ================= SINGLE NOTIFICATION =================
    if (id && !all) {
      await pool.query(
        `UPDATE notifications
         SET is_read = true
         WHERE id = $1 AND user_id = $2`,
        [id, user.userId]
      );

      return res.status(200).json({ success: true });
    }

    // ================= ALL NOTIFICATIONS =================
    if (all === true) {
      await pool.query(
        `UPDATE notifications
         SET is_read = true
         WHERE user_id = $1 AND is_read = false`,
        [user.userId]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Missing id or all flag' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update notification status' });
  }
});