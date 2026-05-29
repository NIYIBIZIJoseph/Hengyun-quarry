import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const allowed = await hasPermission(user.userId, 'roles:view');
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const roles = await pool.query('SELECT id, name FROM roles');
    const perms = await pool.query('SELECT id, name FROM permissions');
    const rolePerms = await pool.query('SELECT role_id, permission_id FROM role_permissions');

    return res.status(200).json({
      roles: roles.rows,
      permissions: perms.rows,
      role_permissions: rolePerms.rows
    });
  }

  return res.status(405).end();
});