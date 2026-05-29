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
        `SELECT * FROM performance_reviews WHERE worker_id = $1 ORDER BY review_date DESC`,
        [workerId]
      );

      return res.status(200).json(result.rows);
    }

    // ================= POST =================
    if (req.method === 'POST') {

      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const { review_date, reviewer, rating, comments } = req.body;

      if (!review_date || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.query(
        `
        INSERT INTO performance_reviews
        (worker_id, review_date, reviewer, rating, comments)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [workerId, review_date, reviewer || null, rating, comments || null]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);