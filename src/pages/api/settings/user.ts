import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT key, value FROM user_preferences WHERE user_id = $1`,
      [user.userId]
    );

    return res.status(200).json(result.rows);
  }

  if (req.method === 'PUT') {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key required' });
    }

    await pool.query(
      `INSERT INTO user_preferences (user_id, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [user.userId, key, value]
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
});