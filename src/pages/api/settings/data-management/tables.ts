import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from '@/lib/permissions';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') return res.status(405).end();

  if (!(await hasPermission(user.userId, 'settings:view'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const tables = [
    'orders', 'users', 'workers', 'attendance', 'products',
    'support_tickets', 'contact_messages', 'audit_logs'
  ];

  const result = [];

  for (const table of tables) {

    const checkColumn = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'deleted_at'
      )`,
      [table]
    );

    const hasDeletedAt = checkColumn.rows[0].exists;

    const resCount = hasDeletedAt
      ? await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted_at IS NULL`)
      : await pool.query(`SELECT COUNT(*) FROM ${table}`);

    result.push({
      name: table,
      count: parseInt(resCount.rows[0].count),
    });
  }

  return res.status(200).json(result);
});