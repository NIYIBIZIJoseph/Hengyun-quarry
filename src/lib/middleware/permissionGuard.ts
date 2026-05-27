import { NextApiRequest, NextApiResponse } from 'next';
import { getUserRoleFromToken } from '../auth-client';

export function requirePermission(permission: string) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    handler: Function
  ) => {
    // ⚠️ no args (your current function limitation)
    const role = getUserRoleFromToken();

    if (!role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAllowed =
      role === 'superadmin' ||
      (role === 'admin' && permission !== 'system:admin');

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    (req as any).authUser = { role };

    return handler(req, res);
  };
}