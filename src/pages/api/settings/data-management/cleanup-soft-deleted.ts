import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') return res.status(405).end();

  if (!(await hasPermission(user.userId, 'settings:edit'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { table, days } = req.body;

  if (!table || !days) {
    return res.status(400).json({ error: 'Table name and days required' });
  }

  const allowedTables = [
    'orders',
    'users',
    'workers',
    'attendance',
    'products',
    'support_tickets',
    'contact_messages'
  ];

  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }

  const result = await pool.query(
    `DELETE FROM ${table}
     WHERE deleted_at < NOW() - INTERVAL '1 day' * $1
     AND deleted_at IS NOT NULL
     RETURNING id`,
    [days]
  );

  await logAudit({
    userId: user.userId,
    action: 'CLEANUP_SOFT_DELETED',
    targetType: table,
    targetId: undefined,
    newData: {
      table,
      days,
      deletedCount: result.rowCount
    },
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  return res.status(200).json({
    success: true,
    deleted: result.rowCount
  });
});