import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    // =========================================
    // VALIDATE ID
    // =========================================
    const { id } = req.query;
    const branchId = Number(id);

    if (!branchId || isNaN(branchId)) {
      return res.status(400).json({ error: 'Invalid branch ID' });
    }

    try {
      // =========================================
      // GET SINGLE BRANCH
      // =========================================
      if (req.method === 'GET') {
        const allowed = await hasPermission(user.userId, 'branch:view');
        if (!allowed) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const result = await pool.query(
          `
          SELECT id, name, location
          FROM branches
          WHERE id = $1 AND deleted_at IS NULL
          `,
          [branchId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Branch not found' });
        }

        return res.status(200).json(result.rows[0]);
      }

      // =========================================
      // UPDATE BRANCH
      // =========================================
      if (req.method === 'PUT') {
        const allowed = await hasPermission(user.userId, 'branch:edit');
        if (!allowed) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const { name, location } = req.body;

        if (!name || !name.trim()) {
          return res.status(400).json({ error: 'Name required' });
        }

        const existing = await pool.query(
          `
          SELECT id, name, location
          FROM branches
          WHERE id = $1 AND deleted_at IS NULL
          `,
          [branchId]
        );

        if (existing.rows.length === 0) {
          return res.status(404).json({ error: 'Branch not found' });
        }

        const oldData = {
          name: existing.rows[0].name,
          location: existing.rows[0].location,
        };

        await pool.query(
          `
          UPDATE branches
          SET name = $1, location = $2
          WHERE id = $3 AND deleted_at IS NULL
          `,
          [name.trim(), location || null, branchId]
        );

        await logAudit({
          userId: user.userId,
          action: 'UPDATE_BRANCH',
          targetType: 'branch',
          targetId: branchId,
          oldData,
          newData: { name: name.trim(), location: location || null },
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({ success: true });
      }

      // =========================================
      // DELETE BRANCH (FIXED - No deleted_by)
      // =========================================
      if (req.method === 'DELETE') {
        const allowed = await hasPermission(user.userId, 'branch:delete');
        if (!allowed) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Check if branch exists
        const existing = await pool.query(
          `
          SELECT id, name FROM branches
          WHERE id = $1 AND deleted_at IS NULL
          `,
          [branchId]
        );

        if (existing.rows.length === 0) {
          return res.status(404).json({ error: 'Branch not found' });
        }

        // ✅ Check usage across all dependent tables
        const usage = await pool.query(
          `
          SELECT
            (SELECT COUNT(*) FROM users WHERE branch_id = $1 AND deleted_at IS NULL) AS users_count,
            (SELECT COUNT(*) FROM orders WHERE branch_id = $1 AND deleted_at IS NULL) AS orders_count,
            (SELECT COUNT(*) FROM workers WHERE branch_id = $1 AND deleted_at IS NULL) AS workers_count,
            (SELECT COUNT(*) FROM inventory WHERE branch_id = $1) AS inventory_count,
            (SELECT COUNT(*) FROM support_tickets WHERE branch_id = $1 AND deleted_at IS NULL) AS tickets_count,
            (SELECT COUNT(*) FROM products WHERE branch_id = $1 AND deleted_at IS NULL) AS products_count
          `,
          [branchId]
        );

        const totalUsage = 
          Number(usage.rows[0].users_count) +
          Number(usage.rows[0].orders_count) +
          Number(usage.rows[0].workers_count) +
          Number(usage.rows[0].inventory_count) +
          Number(usage.rows[0].tickets_count) +
          Number(usage.rows[0].products_count);

        if (totalUsage > 0) {
          const details = [];
          if (usage.rows[0].users_count > 0) details.push(`${usage.rows[0].users_count} user(s)`);
          if (usage.rows[0].orders_count > 0) details.push(`${usage.rows[0].orders_count} order(s)`);
          if (usage.rows[0].workers_count > 0) details.push(`${usage.rows[0].workers_count} worker(s)`);
          if (usage.rows[0].inventory_count > 0) details.push(`${usage.rows[0].inventory_count} inventory item(s)`);
          if (usage.rows[0].tickets_count > 0) details.push(`${usage.rows[0].tickets_count} ticket(s)`);
          if (usage.rows[0].products_count > 0) details.push(`${usage.rows[0].products_count} product(s)`);

          return res.status(409).json({
            error: `Cannot delete branch: ${details.join(', ')} are assigned to it`,
          });
        }

        // ✅ FIXED: Only set deleted_at, no deleted_by
        await pool.query(
          `
          UPDATE branches
          SET deleted_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
          `,
          [branchId]
        );

        await logAudit({
          userId: user.userId,
          action: 'DELETE_BRANCH',
          targetType: 'branch',
          targetId: branchId,
          oldData: { name: existing.rows[0].name },
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });

        return res.status(200).json({
          success: true,
          message: `Branch "${existing.rows[0].name}" deleted successfully`,
        });
      }

      return res.status(405).json({ error: 'Method not allowed' });

    } catch (err: any) {
      console.error('BRANCH API ERROR:', err);
      return res.status(500).json({
        error: err.message || 'Internal server error',
      });
    }
  }
);