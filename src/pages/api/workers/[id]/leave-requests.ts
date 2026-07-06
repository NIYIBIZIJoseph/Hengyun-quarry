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
      const allowed = await hasPermission(user.userId, 'attendance:view');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      try {
        const result = await pool.query(
          `
          SELECT 
            id, 
            start_date, 
            end_date, 
            reason, 
            status,
            approved_by,
            created_at
          FROM leave_requests 
          WHERE worker_id = $1 
          ORDER BY created_at DESC
          `,
          [workerId]
        );

        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        return res.status(500).json({ error: 'Failed to fetch leave requests' });
      }
    }

    // ================= POST =================
    if (req.method === 'POST') {
      const allowed = await hasPermission(user.userId, 'attendance:override');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { start_date, end_date, reason } = req.body;

      // Validate required fields
      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: 'Missing required fields: start_date and end_date are required' 
        });
      }

      if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }

      try {
        const result = await pool.query(
          `
          INSERT INTO leave_requests
          (worker_id, start_date, end_date, reason, status)
          VALUES ($1, $2, $3, $4, 'pending')
          RETURNING *
          `,
          [workerId, start_date, end_date, reason || null]
        );

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'CREATE_LEAVE_REQUEST',
          targetType: 'leave_request',
          targetId: result.rows[0].id,
          newData: result.rows[0],
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Leave request submitted successfully',
          data: result.rows[0] 
        });
      } catch (error) {
        console.error('Error creating leave request:', error);
        return res.status(500).json({ error: 'Failed to create leave request' });
      }
    }

    // ================= PUT =================
    if (req.method === 'PUT') {
      const allowed = await hasPermission(user.userId, 'attendance:override');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { leave_id, status } = req.body;

      // Validate required fields
      if (!leave_id || !status) {
        return res.status(400).json({ 
          error: 'Missing required fields: leave_id and status are required' 
        });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be pending, approved, or rejected' 
        });
      }

      try {
        const result = await pool.query(
          `
          UPDATE leave_requests
          SET status = $1, 
              approved_by = $2
          WHERE id = $3 AND worker_id = $4
          RETURNING *
          `,
          [status, user.userId, leave_id, workerId]
        );

        if (!result.rows.length) {
          return res.status(404).json({ error: 'Leave request not found' });
        }

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'UPDATE_LEAVE_STATUS',
          targetType: 'leave_request',
          targetId: leave_id,
          newData: { status, approved_by: user.userId },
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({ 
          success: true, 
          message: `Leave request ${status} successfully`,
          data: result.rows[0] 
        });
      } catch (error) {
        console.error('Error updating leave request:', error);
        return res.status(500).json({ error: 'Failed to update leave request' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);