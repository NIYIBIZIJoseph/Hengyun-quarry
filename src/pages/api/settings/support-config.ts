import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const branchId = user.branchId;

  if (req.method === 'GET') {
    const allowed = await hasPermission(user.userId, 'settings:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const result = await pool.query(
      `SELECT key, value, description
       FROM branch_settings
       WHERE branch_id = $1
       AND key LIKE 'support_%'`,
      [branchId]
    );

    return res.status(200).json(result.rows);
  }

  if (req.method === 'PUT') {
    const allowed = await hasPermission(user.userId, 'settings:edit');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { key, value } = req.body;

    await pool.query(
      `INSERT INTO branch_settings (branch_id, key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (branch_id, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [branchId, key, value, user.userId]
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
});