import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';
import { logAudit } from '@/lib/audit';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {
    const { id } = req.query;

    // Validate worker ID
    if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const workerId = Number(id);

    // Verify worker exists and user has access
    const { whereClause, params } = enforceBranchIsolation(user, 'w', 'branch_id');
    
    const workerCheck = await pool.query(
      `
      SELECT w.id FROM workers w
      WHERE w.id = $1 AND w.deleted_at IS NULL
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
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      try {
        const result = await pool.query(
          `
          SELECT 
            id, 
            old_salary, 
            new_salary, 
            effective_date, 
            reason,
            created_at
          FROM salary_history 
          WHERE worker_id = $1 
          ORDER BY effective_date DESC
          `,
          [workerId]
        );

        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching salary history:', error);
        return res.status(500).json({ error: 'Failed to fetch salary history' });
      }
    }

    // ================= POST =================
    if (req.method === 'POST') {
      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { old_salary, new_salary, effective_date, reason } = req.body;

      // Validate required fields
      if (!new_salary || !effective_date) {
        return res.status(400).json({ 
          error: 'Missing required fields: new_salary and effective_date are required' 
        });
      }

      if (isNaN(Number(new_salary)) || Number(new_salary) < 0) {
        return res.status(400).json({ error: 'Invalid salary amount' });
      }

      try {
        // Insert salary history record
        const result = await pool.query(
          `
          INSERT INTO salary_history
          (worker_id, old_salary, new_salary, effective_date, reason)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
          `,
          [workerId, old_salary || null, new_salary, effective_date, reason || null]
        );

        // Update worker's current salary
        await pool.query(
          `UPDATE workers SET salary = $1, updated_at = NOW() WHERE id = $2`,
          [new_salary, workerId]
        );

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'UPDATE_SALARY',
          targetType: 'worker',
          targetId: workerId,
          newData: { new_salary, effective_date, reason },
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Salary updated successfully',
          data: result.rows[0] 
        });
      } catch (error) {
        console.error('Error updating salary:', error);
        return res.status(500).json({ error: 'Failed to update salary' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);