import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') return res.status(405).end();

  try {
    const result = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE user_id = $1
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, [user.userId]);

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});