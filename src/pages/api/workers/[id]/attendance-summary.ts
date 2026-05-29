import type { NextApiRequest, NextApiResponse } from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }

    const allowed = await hasPermission(
      user.userId,
      'attendance:view'
    );

    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden',
      });
    }

    const { id } = req.query;

    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({
        error: 'Invalid worker ID',
      });
    }

    const now = new Date();

    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
      .toISOString()
      .split('T')[0];

    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    )
      .toISOString()
      .split('T')[0];

    try {

      const { whereClause, params } =
        enforceBranchIsolation(
          user,
          'w',
          'branch_id'
        );

      const result = await pool.query(
        `
        SELECT
          COUNT(*) AS total_days,

          COUNT(*) FILTER (
            WHERE a.status = 'present'
          ) AS present_days,

          COUNT(*) FILTER (
            WHERE a.status = 'absent'
          ) AS absent_days,

          COUNT(*) FILTER (
            WHERE a.status = 'late'
          ) AS late_days

        FROM attendance a

        JOIN workers w
          ON a.worker_id = w.id

        WHERE
          a.worker_id = $1
          AND a.date BETWEEN $2 AND $3
          AND a.deleted_at IS NULL
          AND w.deleted_at IS NULL
          ${whereClause}
        `,
        [id, startDate, endDate, ...params]
      );

      return res.status(200).json(
        result.rows[0]
      );

    } catch (err: any) {

      console.error(
        'ATTENDANCE SUMMARY ERROR:',
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