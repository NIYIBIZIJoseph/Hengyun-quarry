import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') return res.status(405).end();

  try {
    const result = await pool.query(
      'SELECT modules FROM role_dashboard_config WHERE role_name = $1',
      [user.role]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        modules: ['workforce', 'support', 'attendanceSnapshot']
      });
    }

    return res.status(200).json({
      modules: result.rows[0].modules
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch dashboard config' });
  }
});