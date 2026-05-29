import type { NextApiRequest, NextApiResponse } from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';
import { logAudit } from '@/lib/audit';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    const { id } = req.query;

    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const workerId = Number(id);

    const { whereClause, params } =
      enforceBranchIsolation(user, 'w', 'branch_id');

    // VERIFY WORKER IS IN USER BRANCH
    const workerCheck = await pool.query(
      `
      SELECT w.id
      FROM workers w
      WHERE w.id = $1
      ${whereClause}
      `,
      [workerId, ...params]
    );

    if (!workerCheck.rows.length) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // ================= GET =================
    if (req.method === 'GET') {

      const allowed = await hasPermission(user.userId, 'worker:view');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const result = await pool.query(
        `SELECT * FROM worker_documents WHERE worker_id = $1 ORDER BY uploaded_at DESC`,
        [workerId]
      );

      return res.status(200).json(result.rows);
    }

    // ================= POST =================
    if (req.method === 'POST') {

      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const { type, title, file_url } = req.body;

      if (!type || !file_url) {
        return res.status(400).json({ error: 'Type and file URL required' });
      }

      const result = await pool.query(
        `
        INSERT INTO worker_documents (worker_id, type, title, file_url)
        VALUES ($1,$2,$3,$4)
        RETURNING *
        `,
        [workerId, type, title || null, file_url]
      );

      await logAudit({
        userId: user.userId,
        action: 'CREATE_DOCUMENT',
        targetType: 'worker_document',
        targetId: result.rows[0].id,
        newData: result.rows[0],
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json(result.rows[0]);
    }

    // ================= DELETE =================
    if (req.method === 'DELETE') {

      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });

      const { docId } = req.body;

      if (!docId) {
        return res.status(400).json({ error: 'Document ID required' });
      }

      await pool.query(
        `DELETE FROM worker_documents WHERE id = $1 AND worker_id = $2`,
        [docId, workerId]
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);