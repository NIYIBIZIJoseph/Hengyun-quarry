import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET PRODUCTS =================
  if (req.method === 'GET') {

    const allowed = await hasPermission(user.userId, 'product:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { whereClause, params } =
      enforceBranchIsolation(user, 'p', 'branch_id');

    const result = await pool.query(
      `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ${whereClause}
      ORDER BY p.name ASC
      `,
      params
    );

    return res.status(200).json(result.rows);
  }

  // ================= CREATE PRODUCT =================
  if (req.method === 'POST') {

    const allowed = await hasPermission(user.userId, 'product:create');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const {
      name,
      category_id,
      price,
      stock_quantity,
      description,
      image_url,
      reorder_level,
      is_active,
    } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category required' });
    }

    let branchId = user.branchId;

    if (user.role === ROLES.SUPERADMIN && req.body.branch_id) {
      branchId = req.body.branch_id;
    }

    const result = await pool.query(
      `
      INSERT INTO products (
        name,
        category_id,
        price,
        stock_quantity,
        description,
        image_url,
        reorder_level,
        is_active,
        branch_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        name,
        category_id,
        price || 0,
        stock_quantity || 0,
        description || '',
        image_url || '',
        reorder_level || 20,
        is_active !== false,
        branchId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});