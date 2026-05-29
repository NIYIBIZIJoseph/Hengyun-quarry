import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') return res.status(405).end();

  if (!(await hasPermission(user.userId, 'roles:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = await pool.query(
    'SELECT id, name, description FROM permissions ORDER BY name'
  );

  return res.status(200).json(result.rows);
});