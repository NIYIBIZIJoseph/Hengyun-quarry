import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import {
  verifyToken,
  hasPermission,
} from '@/lib/auth';

import { logAudit } from '@/lib/audit';
import { ROLES } from '@/lib/roles';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ======================================================
  // AUTH
  // ======================================================

  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  // ======================================================
  // GET SETTINGS
  // ======================================================

  if (req.method === 'GET') {
    try {
      if (
        !(await hasPermission(
          user.userId,
          'settings:view'
        ))
      ) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      let branchId: number | null = null;

      // Non-superadmin only sees own branch
      if (user.role !== ROLES.SUPERADMIN) {
        branchId = user.branchId ?? null;
      }

      // Superadmin can filter by branch
      if (
        user.role === ROLES.SUPERADMIN &&
        req.query.branch_id
      ) {
        branchId = Number(req.query.branch_id);
      }

      const result = await pool.query(
        `
        SELECT
          bs.key,
          bs.value,
          bs.description,
          b.name AS branch_name

        FROM branch_settings bs

        JOIN branches b
          ON bs.branch_id = b.id

        WHERE
          ($1::int IS NULL OR bs.branch_id = $1)

        ORDER BY
          bs.branch_id,
          bs.key
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
      if (
        !(await hasPermission(
          user.userId,
          'settings:edit'
        ))
      ) {
        return res.status(403).json({
          error: 'Forbidden',
        });
      }

      const {
        branch_id,
        key,
        value,
      } = req.body;

      if (!branch_id || !key) {
        return res.status(400).json({
          error: 'Branch ID and key required',
        });
      }

      // Non-superadmin cannot edit another branch
      if (
        user.role !== ROLES.SUPERADMIN &&
        user.branchId !== Number(branch_id)
      ) {
        return res.status(403).json({
          error: 'Cannot edit another branch',
        });
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
        [
          Number(branch_id),
          key,
          value,
          user.userId,
        ]
      );

      await logAudit({
        userId: user.userId,
        action: 'UPDATE',
        targetType: 'branch_setting',
        newData: {
          branch_id: Number(branch_id),
          key,
          value,
        },
        ipAddress:
          (req.headers[
            'x-forwarded-for'
          ] as string) ||
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

  // ======================================================
  // METHOD NOT ALLOWED
  // ======================================================

  return res.status(405).json({
    error: 'Method not allowed',
  });
}