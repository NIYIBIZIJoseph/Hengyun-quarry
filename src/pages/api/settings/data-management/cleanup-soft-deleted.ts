import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await hasPermission(user.userId, 'purge:data');
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
  }

  const { days = 30 } = req.body;

  if (!days || days < 1) {
    return res.status(400).json({ error: 'Days must be a positive number' });
  }

  // ✅ Include ALL tables that have soft-delete
  const allowedTables = [
    'orders',
    'users',
    'workers',
    'attendance',
    'products',
    'support_tickets',
    'contact_messages',
    'branches',
    'departments'
  ];

  try {
    const client = await pool.connect();
    let totalDeleted = 0;
    const deletedCounts: Record<string, number> = {};

    try {
      await client.query('BEGIN');

      for (const table of allowedTables) {
        // ✅ Check if table has deleted_at column
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'deleted_at'
          )
        `, [table]);

        if (!tableCheck.rows[0].exists) {
          continue; // Skip tables without deleted_at
        }

        // ✅ Delete records older than specified days
        const result = await client.query(
          `DELETE FROM ${table}
           WHERE deleted_at IS NOT NULL 
           AND deleted_at < NOW() - INTERVAL '1 day' * $1
           RETURNING id`,
          [days]
        );

        const count = result.rowCount || 0;
        if (count > 0) {
          deletedCounts[table] = count;
          totalDeleted += count;

          // ✅ Log audit for each table
          await logAudit({
            userId: user.userId,
            action: 'CLEANUP_SOFT_DELETED',
            targetType: table,
            targetId: undefined,
            newData: {
              table,
              days,
              deletedCount: count
            },
            ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          });
        }
      }

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${totalDeleted} soft-deleted records older than ${days} days`,
        deletedCounts,
        totalDeleted
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('CLEANUP ERROR:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to cleanup records' 
    });
  }
});