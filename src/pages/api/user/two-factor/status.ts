import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      `SELECT two_factor_enabled FROM users WHERE id = $1`,
      [user.userId]
    );

    const enabled = result.rows[0]?.two_factor_enabled || false;

    return res.status(200).json({ enabled });
  } catch (error: any) {
    console.error('2FA status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get 2FA status' });
  }
});