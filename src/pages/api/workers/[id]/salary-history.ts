import type { NextApiRequest, NextApiResponse } from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    const { id } = req.query;

    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const workerId = Number(id);

    // ================= GET =================
    if (req.method === 'GET') {

      const allowed = await hasPermission(user.userId, 'worker:view');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const result = await pool.query(
        `SELECT * FROM salary_history WHERE worker_id = $1 ORDER BY effective_date DESC`,
        [workerId]
      );

      return res.status(200).json(result.rows);
    }

    // ================= POST =================
    if (req.method === 'POST') {

      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const {
        old_salary,
        new_salary,
        effective_date,
        reason,
      } = req.body;

      if (!new_salary || !effective_date) {
        return res.status(400).json({ error: 'Missing fields' });
      }

      await pool.query(
        `
        INSERT INTO salary_history
        (worker_id, old_salary, new_salary, effective_date, reason)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [workerId, old_salary || null, new_salary, effective_date, reason || null]
      );

      await pool.query(
        `UPDATE workers SET salary = $1 WHERE id = $2`,
        [new_salary, workerId]
      );

      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);