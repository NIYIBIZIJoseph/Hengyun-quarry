import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { ROLES } from '@/lib/roles';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: any) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await hasPermission(user.userId, 'dashboard:view');
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  try {
    let branchFilter = '';
    let branchParams: any[] = [];
    if (user.role !== ROLES.SUPERADMIN && user.branchId) {
      branchFilter = ' AND o.branch_id = $1';
      branchParams = [user.branchId];
    }

    const ordersRes = await pool.query(
      `SELECT COUNT(*) AS count FROM orders o WHERE o.deleted_at IS NULL ${branchFilter}`,
      branchParams
    );
    const totalOrders = parseInt(ordersRes.rows[0].count);

    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(o.total_amount), 0) AS revenue
       FROM orders o
       WHERE o.status IN ('approved', 'delivered') AND o.deleted_at IS NULL
       ${branchFilter}`,
      branchParams
    );
    const totalRevenue = Number(revenueRes.rows[0].revenue);

    const monthlyRes = await pool.query(
      `SELECT COALESCE(SUM(o.total_amount), 0) AS monthly
       FROM orders o
       WHERE o.status IN ('approved', 'delivered') AND o.deleted_at IS NULL
         AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       ${branchFilter}`,
      branchParams
    );
    const monthlyRevenue = Number(monthlyRes.rows[0].monthly);

    const workersRes = await pool.query(
      `SELECT COUNT(*) AS count FROM workers w
       WHERE w.deleted_at IS NULL AND w.is_active = true
       ${branchFilter.replace('o.branch_id', 'w.branch_id')}`,
      branchParams
    );
    const totalWorkers = parseInt(workersRes.rows[0].count);

    const pendingRes = await pool.query(
      `SELECT COUNT(*) AS count FROM orders o
       WHERE o.status = 'pending' AND o.deleted_at IS NULL ${branchFilter}`,
      branchParams
    );
    const pendingOrders = parseInt(pendingRes.rows[0].count);

    const lowStockRes = await pool.query(
      `SELECT COUNT(*) AS count FROM products p
       WHERE p.stock_quantity <= p.reorder_level AND p.stock_quantity > 0 AND p.deleted_at IS NULL
       ${branchFilter.replace('o.branch_id', 'p.branch_id')}`,
      branchParams
    );
    const lowStockCount = parseInt(lowStockRes.rows[0].count);

    const outOfStockRes = await pool.query(
      `SELECT COUNT(*) AS count FROM products p
       WHERE p.stock_quantity <= 0 AND p.deleted_at IS NULL
       ${branchFilter.replace('o.branch_id', 'p.branch_id')}`,
      branchParams
    );
    const outOfStockCount = parseInt(outOfStockRes.rows[0].count);

    return res.status(200).json({
      totalOrders,
      totalRevenue,
      revenue: totalRevenue,
      monthlyRevenue,
      totalWorkers,
      pendingOrders,
      lowStockCount,
      outOfStockCount,
    });
  } catch (err: any) {
    console.error('DASHBOARD STATS ERROR:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});