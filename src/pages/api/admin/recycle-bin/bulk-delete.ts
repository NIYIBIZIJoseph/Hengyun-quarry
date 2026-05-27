import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/middleware/requireAuth';
import { hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function getTable(type: string): string {
  switch (type) {
    case 'ticket':
      return 'support_tickets';
    case 'message':
      return 'contact_messages';
    case 'worker':
      return 'workers';
    case 'attendance':
      return 'attendance';
    case 'product':
      return 'products';
    case 'order':
      return 'orders';
    default:
      throw new Error(`Invalid type: ${type}`);
  }
}

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await hasPermission(user.userId, 'recycle:view');
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let deletedCount = 0;

    for (const item of items) {
      if (!item?.type || !item?.id) continue;

      const table = getTable(item.type);

      const result = await client.query(
        `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
        [item.id]
      );

      const rowsDeleted = result.rowCount ?? 0;

      if (rowsDeleted > 0) {
        deletedCount++;

        await logAudit({
          userId: user.userId,
          action: 'BULK_PERMANENT_DELETE',
          targetType: item.type,
          targetId: item.id,
          ipAddress: req.headers['x-forwarded-for'] as string,
          userAgent: req.headers['user-agent'],
        });
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);

    return res.status(500).json({
      error: err.message || 'Internal server error',
    });
  } finally {
    client.release();
  }
});