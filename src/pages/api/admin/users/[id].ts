import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth, isSuperAdmin, hasPermission } from '@/lib/auth';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: any) => {
  const { id } = req.query;
  const userId = Number(id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const existing = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (!existing.rows.length) {
    return res.status(404).json({ error: 'User not found' });
  }

  // ✅ ROLE CHECK (NO SHADOWING)
  const superAdmin = isSuperAdmin(user);

  if (!superAdmin) {
    if (existing.rows[0].branch_id !== user.branchId) {
      return res.status(403).json({ error: 'Cross-branch blocked' });
    }
  }

  if (req.method === 'PUT') {
    const allowed = await hasPermission(user.userId, 'user:edit');

    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json({ success: true });
  }

  return res.status(405).end();
});