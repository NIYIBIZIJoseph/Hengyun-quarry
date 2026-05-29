import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";
import { logAudit } from "@/lib/audit";
import { ROLES } from "@/lib/roles";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const { id } = req.query;
  const productId = Number(id);

  if (!productId) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  // ================= BRANCH SECURITY CHECK =================
  const { whereClause, params } =
    enforceBranchIsolation(user, 'p', 'branch_id');

  const productRes = await pool.query(
    `
    SELECT p.*
    FROM products p
    WHERE p.id = $${params.length + 1}
      AND p.deleted_at IS NULL
      ${whereClause}
    `,
    [...params, productId]
  );

  if (!productRes.rows.length) {
    return res.status(404).json({ error: 'Product not found or access denied' });
  }

  const existing = productRes.rows[0];

  // ================= GET =================
  if (req.method === 'GET') {

    const allowed = await hasPermission(user.userId, 'product:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    return res.status(200).json(existing);
  }

  // ================= UPDATE =================
  if (req.method === 'PUT') {

    const allowed = await hasPermission(user.userId, 'product:edit');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const {
      name,
      description,
      price,
      category_id,
      image_url,
      stock_quantity,
      reorder_level,
      is_active,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category_id = COALESCE($4, category_id),
        image_url = COALESCE($5, image_url),
        stock_quantity = COALESCE($6, stock_quantity),
        reorder_level = COALESCE($7, reorder_level),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [
        name,
        description,
        price,
        category_id,
        image_url,
        stock_quantity,
        reorder_level,
        is_active,
        productId,
      ]
    );

    const updated = result.rows[0];

    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'product',
      targetId: productId,
      oldData: existing,
      newData: updated,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json(updated);
  }

  // ================= DELETE =================
  if (req.method === 'DELETE') {

    const allowed = await hasPermission(user.userId, 'product:delete');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    await pool.query(
      `
      UPDATE products
      SET deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, productId]
    );

    await logAudit({
      userId: user.userId,
      action: 'DELETE',
      targetType: 'product',
      targetId: productId,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});