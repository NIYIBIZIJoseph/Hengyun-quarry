import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { verifyToken, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

import { ROLES } from '@/lib/roles';
import { AuthUser } from '@/lib/auth-types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let user: AuthUser | null = null;

  try {
    user = verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ======================================================
  // GET SETTINGS
  // ======================================================

  if (req.method === 'GET') {
    try {
      if (!(await hasPermission(user.userId, 'settings:view'))) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      let branchId = user.branchId;

      const queryBranchId = req.query.branch_id;

      if (
        user.role === ROLES.SUPERADMIN &&
        queryBranchId
      ) {
        branchId = Number(queryBranchId);
      }

      const result = await pool.query(
        `
        SELECT key, value, description
        FROM branch_settings
        WHERE branch_id = $1
        `,
        [branchId]
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('GET SETTINGS ERROR:', error);

      return res.status(500).json({
        error: 'Failed to fetch settings',
      });
    }
  }

  // ======================================================
  // UPDATE SETTINGS
  // ======================================================

  if (req.method === 'PUT') {
    try {
      if (!(await hasPermission(user.userId, 'settings:edit'))) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { key, value, branch_id } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({
          error: 'Key and value required',
        });
      }

      let branchId = user.branchId;

      if (
        user.role === ROLES.SUPERADMIN &&
        branch_id
      ) {
        branchId = Number(branch_id);
      }

      await pool.query(
        `
        INSERT INTO branch_settings
        (
          branch_id,
          key,
          value,
          updated_by,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          NOW()
        )

        ON CONFLICT (branch_id, key)

        DO UPDATE SET
          value = EXCLUDED.value,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
        `,
        [branchId, key, value, user.userId]
      );

      await logAudit({
        userId: user.userId,
        action: 'UPDATE_BRANCH_SETTING',
        targetType: 'branch_setting',
        targetId: undefined,
        newData: {
          branchId,
          key,
          value,
        },
        ipAddress:
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error('UPDATE SETTINGS ERROR:', error);

      return res.status(500).json({
        error: 'Failed to update settings',
      });
    }
  }

  return res.status(405).json({
    error: 'Method not allowed',
  });
}