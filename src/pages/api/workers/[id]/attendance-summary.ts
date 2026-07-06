import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check permissions
    const allowed = await hasPermission(user.userId, 'attendance:view');
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { id } = req.query;

    // Validate worker ID
    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    // Get current month date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    try {
      // Verify worker exists and user has access
      const { whereClause, params } = enforceBranchIsolation(user, 'w', 'branch_id');
      
      const workerCheck = await pool.query(
        `
        SELECT w.id FROM workers w
        WHERE w.id = $1 AND w.deleted_at IS NULL
        ${whereClause}
        `,
        [id, ...params]
      );

      if (!workerCheck.rows.length) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      // Get attendance summary
      const result = await pool.query(
        `
        SELECT
          COUNT(*) AS total_days,
          COUNT(*) FILTER (WHERE a.status = 'present') AS present_days,
          COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_days,
          COUNT(*) FILTER (WHERE a.status = 'late') AS late_days
        FROM attendance a
        JOIN workers w ON a.worker_id = w.id
        WHERE
          a.worker_id = $1
          AND a.date BETWEEN $2 AND $3
          AND a.deleted_at IS NULL
          AND w.deleted_at IS NULL
        `,
        [id, startDate, endDate]
      );

      // Return with default values if no records found
      const summary = result.rows[0] || {
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
      };

      return res.status(200).json(summary);
    } catch (error: any) {
      console.error('ATTENDANCE SUMMARY ERROR:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  }
);