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
            review_date, 
            reviewer, 
            rating, 
            comments,
            created_at
          FROM performance_reviews 
          WHERE worker_id = $1 
          ORDER BY review_date DESC
          `,
          [workerId]
        );

        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching performance reviews:', error);
        return res.status(500).json({ error: 'Failed to fetch performance reviews' });
      }
    }

    // ================= POST =================
    if (req.method === 'POST') {
      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { review_date, reviewer, rating, comments } = req.body;

      // Validate required fields
      if (!review_date || !rating) {
        return res.status(400).json({ 
          error: 'Missing required fields: review_date and rating are required' 
        });
      }

      if (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      try {
        const result = await pool.query(
          `
          INSERT INTO performance_reviews
          (worker_id, review_date, reviewer, rating, comments)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
          `,
          [workerId, review_date, reviewer || null, rating, comments || null]
        );

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'CREATE_PERFORMANCE_REVIEW',
          targetType: 'performance_review',
          targetId: result.rows[0].id,
          newData: result.rows[0],
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Performance review added successfully',
          data: result.rows[0] 
        });
      } catch (error) {
        console.error('Error adding performance review:', error);
        return res.status(500).json({ error: 'Failed to add performance review' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);