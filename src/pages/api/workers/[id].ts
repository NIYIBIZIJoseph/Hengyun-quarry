// src/pages/api/workers/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid worker ID' });
  }

  const workerId = Number(id);

  // ================= GET SINGLE WORKER =================
  if (req.method === 'GET') {
    const allowed = await hasPermission(user.userId, 'worker:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    try {
      const result = await pool.query(
        `
        SELECT
          w.*,
          d.name AS department_name,
          b.name AS branch_name
        FROM workers w
        LEFT JOIN departments d ON w.department_id = d.id
        LEFT JOIN branches b ON w.branch_id = b.id
        WHERE w.id = $1
        LIMIT 1
        `,
        [workerId]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch worker' });
    }
  }

  // ================= UPDATE WORKER =================
  if (req.method === 'PUT') {
    const allowed = await hasPermission(user.userId, 'worker:edit');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    try {
      const {
        full_name,
        phone,
        email,
        department_id,
        salary,
        join_date,
        location,
        image_url,
        is_active,
      } = req.body;

      const existing = await pool.query(
        `SELECT * FROM workers WHERE id = $1`,
        [workerId]
      );

      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      const oldData = existing.rows[0];

      // ✅ REMOVED updated_at - column doesn't exist
      const updated = await pool.query(
        `
        UPDATE workers
        SET
          full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          department_id = COALESCE($4, department_id),
          salary = COALESCE($5, salary),
          join_date = COALESCE($6, join_date),
          location = COALESCE($7, location),
          image_url = COALESCE($8, image_url),
          is_active = COALESCE($9, is_active)
        WHERE id = $10
        RETURNING *
        `,
        [
          full_name,
          phone || null,
          email || null,
          department_id || null,
          salary || null,
          join_date || null,
          location || null,
          image_url || null,
          is_active,
          workerId,
        ]
      );

      await logAudit({
        userId: user.userId,
        action: 'UPDATE_WORKER',
        targetType: 'worker',
        targetId: workerId,
        oldData,
        newData: updated.rows[0],
        ipAddress: req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json(updated.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update worker' });
    }
  }

  // ================= TWO-STEP DELETE =================
  if (req.method === 'DELETE') {
    const allowed = await hasPermission(user.userId, 'worker:delete');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    try {
      // ✅ Get worker info
      const worker = await pool.query(
        `SELECT id, full_name, is_active FROM workers WHERE id = $1`,
        [workerId]
      );

      if (!worker.rows.length) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      const workerData = worker.rows[0];

      // ✅ STEP 1: If worker is active → DEACTIVATE (soft delete)
      if (workerData.is_active === true) {
        await pool.query(
          `UPDATE workers SET is_active = false WHERE id = $1`,
          [workerId]
        );

        await logAudit({
          userId: user.userId,
          action: 'DEACTIVATE_WORKER',
          targetType: 'worker',
          targetId: workerId,
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({
          success: true,
          action: 'deactivated',
          message: `${workerData.full_name} has been deactivated`
        });
      }

      // ✅ STEP 2: If worker is inactive → PERMANENTLY DELETE
      if (workerData.is_active === false) {
        // ✅ First, delete related records to avoid foreign key violations
        await pool.query(
          `DELETE FROM attendance WHERE worker_id = $1`,
          [workerId]
        );
        await pool.query(
          `DELETE FROM worker_documents WHERE worker_id = $1`,
          [workerId]
        );
        await pool.query(
          `DELETE FROM salary_history WHERE worker_id = $1`,
          [workerId]
        );
        await pool.query(
          `DELETE FROM leave_requests WHERE worker_id = $1`,
          [workerId]
        );
        await pool.query(
          `DELETE FROM performance_reviews WHERE worker_id = $1`,
          [workerId]
        );

        // ✅ Now permanently delete the worker
        await pool.query(
          `DELETE FROM workers WHERE id = $1`,
          [workerId]
        );

        await logAudit({
          userId: user.userId,
          action: 'DELETE_WORKER_PERMANENT',
          targetType: 'worker',
          targetId: workerId,
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({
          success: true,
          action: 'permanently_deleted',
          message: `${workerData.full_name} has been permanently deleted`
        });
      }

      return res.status(400).json({ error: 'Invalid worker state' });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to process worker' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});