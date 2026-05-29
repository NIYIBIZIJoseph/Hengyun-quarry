import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') return res.status(405).end();

  const result = await pool.query(`
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.created_at > NOW() - INTERVAL '30 days'
      AND o.deleted_at IS NULL
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
    LIMIT 5
  `);

  return res.status(200).json(result.rows);
});