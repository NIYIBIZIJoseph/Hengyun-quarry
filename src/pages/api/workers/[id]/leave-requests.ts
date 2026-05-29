import type { NextApiRequest, NextApiResponse } from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    const { id } = req.query;

    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const workerId = Number(id);

    const { whereClause, params } =
      enforceBranchIsolation(user, 'w', 'branch_id');

    const workerCheck = await pool.query(
      `
      SELECT id FROM workers
      WHERE id = $1
      ${whereClause}
      `,
      [workerId, ...params]
    );

    if (!workerCheck.rows.length) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // ================= GET =================
    if (req.method === 'GET') {

      const allowed = await hasPermission(user.userId, 'attendance:view');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const result = await pool.query(
        `SELECT * FROM leave_requests WHERE worker_id = $1 ORDER BY created_at DESC`,
        [workerId]
      );

      return res.status(200).json(result.rows);
    }

    // ================= POST =================
    if (req.method === 'POST') {

      const allowed = await hasPermission(user.userId, 'attendance:override');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const { start_date, end_date, reason } = req.body;

      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start and end required' });
      }

      const result = await pool.query(
        `
        INSERT INTO leave_requests
        (worker_id, start_date, end_date, reason, status)
        VALUES ($1,$2,$3,$4,'pending')
        RETURNING *
        `,
        [workerId, start_date, end_date, reason || null]
      );

      return res.status(201).json(result.rows[0]);
    }

    // ================= PUT =================
    if (req.method === 'PUT') {

      const allowed = await hasPermission(user.userId, 'attendance:override');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const { leave_id, status } = req.body;

      if (!leave_id || !status) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      await pool.query(
        `
        UPDATE leave_requests
        SET status = $1, approved_by = $2
        WHERE id = $3 AND worker_id = $4
        `,
        [status, user.userId, leave_id, workerId]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);