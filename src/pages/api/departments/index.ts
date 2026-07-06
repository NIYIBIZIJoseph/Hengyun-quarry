import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: any) => {

  // ================= GET - All Departments =================
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'department:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const result = await pool.query(
        'SELECT id, name FROM departments WHERE deleted_at IS NULL ORDER BY name'
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching departments:', error);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }
  }

  // ================= POST - Create Department =================
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'department:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name required' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO departments (name) VALUES ($1) RETURNING id, name`,
        [name.trim()]
      );

      await logAudit({
        userId: user.userId,
        action: 'CREATE_DEPARTMENT',
        targetType: 'department',
        targetId: result.rows[0].id,
        newData: { name: name.trim() },
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating department:', error);
      return res.status(500).json({ error: 'Failed to create department' });
    }
  }

  // ================= PUT - Update Department =================
  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'department:edit'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id, name } = req.body;
    if (!id || !name || !name.trim()) {
      return res.status(400).json({ error: 'ID and name required' });
    }

    try {
      // Check if department exists
      const check = await pool.query(
        `SELECT id, name FROM departments WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }

      const result = await pool.query(
        `UPDATE departments SET name = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, name`,
        [name.trim(), id]
      );

      await logAudit({
        userId: user.userId,
        action: 'UPDATE_DEPARTMENT',
        targetType: 'department',
        targetId: id,
        oldData: { name: check.rows[0].name },
        newData: { name: name.trim() },
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error updating department:', error);
      return res.status(500).json({ error: 'Failed to update department' });
    }
  }

  // ================= DELETE - Soft Delete Department =================
  if (req.method === 'DELETE') {
    if (!(await hasPermission(user.userId, 'department:delete'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Department ID required' });
    }

    try {
      // Check if department exists
      const check = await pool.query(
        `SELECT id, name FROM departments WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Check if department has workers
      const workerCheck = await pool.query(
        `SELECT COUNT(*)::int FROM workers WHERE department_id = $1 AND deleted_at IS NULL`,
        [id]
      );
      
      if (workerCheck.rows[0].count > 0) {
        return res.status(409).json({ 
          error: `Cannot delete department: ${workerCheck.rows[0].count} worker(s) are assigned to it` 
        });
      }

      await pool.query(
        `UPDATE departments SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      await logAudit({
        userId: user.userId,
        action: 'DELETE_DEPARTMENT',
        targetType: 'department',
        targetId: Number(id),
        oldData: { name: check.rows[0].name },
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({ 
        success: true, 
        message: `Department "${check.rows[0].name}" deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      return res.status(500).json({ error: 'Failed to delete department' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});