import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  if (!(await hasPermission(user.userId, 'department:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await pool.query(
    'SELECT id, name FROM departments WHERE deleted_at IS NULL ORDER BY name'
  );

  return res.status(200).json(result.rows);
});