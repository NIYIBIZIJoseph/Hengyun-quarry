import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasRole } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import type { AuthUser } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  const user = verifyToken(req) as AuthUser | null;

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  if (!hasRole(user, [ROLES.ADMIN, ROLES.SUPERADMIN])) {
    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  if (req.method === 'DELETE') {
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        error: 'Invalid attendance ID',
      });
    }

    await pool.query(
      `
      UPDATE attendance
      SET deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, Number(id)]
    );

    return res.status(200).json({
      success: true,
    });
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({
    error: 'Method not allowed',
  });
}