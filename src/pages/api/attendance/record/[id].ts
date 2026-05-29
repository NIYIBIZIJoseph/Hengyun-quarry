import type { NextApiRequest, NextApiResponse } from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    // =========================================
    // METHOD CHECK
    // =========================================
    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);

      return res.status(405).json({
        error: 'Method not allowed',
      });
    }

    // =========================================
    // PERMISSION CHECK
    // =========================================
    const allowed = await hasPermission(
      user.userId,
      'attendance:delete'
    );

    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
      });
    }

    // =========================================
    // VALIDATE ID
    // =========================================
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        error: 'Invalid attendance ID',
      });
    }

    try {

      // =========================================
      // SOFT DELETE
      // =========================================
      await pool.query(
        `
        UPDATE attendance
        SET
          deleted_at = NOW(),
          deleted_by = $1
        WHERE id = $2
        `,
        [user.userId, Number(id)]
      );

      return res.status(200).json({
        success: true,
      });

    } catch (err: any) {

      console.error(
        'DELETE ATTENDANCE ERROR:',
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          'Internal server error',
      });
    }
  }
);