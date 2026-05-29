import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const allowed = await hasPermission(user.userId, 'settings:edit');
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  const { action, table, days, confirm } = req.body;

  if (action === 'backup') {
    return res.status(200).json({ message: 'Backup started (placeholder)' });
  }

  if (action === 'export') {
    const result = await pool.query(`SELECT * FROM ${table} LIMIT 100`);
    return res.status(200).json(result.rows);
  }

  if (action === 'purge') {
    const result = await pool.query(
      `DELETE FROM ${table} WHERE created_at < NOW() - INTERVAL '${days} days'`
    );

    await logAudit({
      userId: user.userId,
      action: 'PURGE',
      targetType: table,
      newData: { days, count: result.rowCount }
    });

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
});