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
            type, 
            title, 
            file_url, 
            uploaded_at
          FROM worker_documents 
          WHERE worker_id = $1 
          ORDER BY uploaded_at DESC
          `,
          [workerId]
        );

        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }
    }

    // ================= POST =================
    if (req.method === 'POST') {
      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { type, title, file_url } = req.body;

      // Validate required fields
      if (!type || !file_url) {
        return res.status(400).json({ 
          error: 'Missing required fields: type and file_url are required' 
        });
      }

      const validTypes = ['contract', 'id_card', 'certificate', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: `Invalid document type. Must be one of: ${validTypes.join(', ')}` 
        });
      }

      try {
        const result = await pool.query(
          `
          INSERT INTO worker_documents 
          (worker_id, type, title, file_url)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [workerId, type, title || null, file_url]
        );

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'CREATE_DOCUMENT',
          targetType: 'worker_document',
          targetId: result.rows[0].id,
          newData: result.rows[0],
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(201).json({ 
          success: true, 
          message: 'Document uploaded successfully',
          data: result.rows[0] 
        });
      } catch (error) {
        console.error('Error uploading document:', error);
        return res.status(500).json({ error: 'Failed to upload document' });
      }
    }

    // ================= DELETE =================
    if (req.method === 'DELETE') {
      const allowed = await hasPermission(user.userId, 'worker:edit');
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }

      const { docId } = req.body;

      if (!docId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      try {
        const result = await pool.query(
          `
          DELETE FROM worker_documents 
          WHERE id = $1 AND worker_id = $2
          RETURNING id
          `,
          [docId, workerId]
        );

        if (!result.rows.length) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Log audit
        await logAudit({
          userId: user.userId,
          action: 'DELETE_DOCUMENT',
          targetType: 'worker_document',
          targetId: docId,
          oldData: { deleted: true },
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Document deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ error: 'Failed to delete document' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
);