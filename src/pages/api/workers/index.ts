import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { enforceBranchIsolation } from '@/lib/branch';
import { createNotification, createNotificationForAllAdmins } from '@/lib/notifications';
import { ROLES } from '@/lib/roles';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET WORKERS =================
  if (req.method === 'GET') {
    const allowed = await hasPermission(user.userId, 'worker:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { whereClause, params } =
      enforceBranchIsolation(user, 'w', 'branch_id');

    const result = await pool.query(
      `
      SELECT
        w.*,
        b.name AS branch_name,
        d.name AS department_name
      FROM workers w
      LEFT JOIN branches b ON w.branch_id = b.id
      LEFT JOIN departments d ON w.department_id = d.id
      WHERE w.deleted_at IS NULL
      ${whereClause}
      ORDER BY w.full_name
      `,
      params
    );

    return res.status(200).json(result.rows);
  }

  // ================= CREATE WORKER =================
  if (req.method === 'POST') {
    const allowed = await hasPermission(user.userId, 'worker:create');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const {
      full_name,
      phone,
      email,
      department_id,
      salary,
      join_date,
      location,
      image_url,
    } = req.body;

    let branchId = user.branchId;

    if (user.role === ROLES.SUPERADMIN && req.body.branch_id) {
      branchId = req.body.branch_id;
    }

    const result = await pool.query(
      `
      INSERT INTO workers (
        full_name, phone, email,
        department_id, salary, join_date,
        location, image_url, branch_id, is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      RETURNING *
      `,
      [
        full_name,
        phone || null,
        email || null,
        department_id || null,
        salary || null,
        join_date || null,
        location || null,
        image_url || null,
        branchId,
      ]
    );

    const worker = result.rows[0];

    await createNotificationForAllAdmins(
      'New Worker Added',
      `${full_name} added`,
      'worker',
      'low',
      `/dashboard/workers/${worker.id}`
    );

    await logAudit({
      userId: user.userId,
      action: 'CREATE',
      targetType: 'worker',
      targetId: worker.id,
      newData: worker,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json(worker);
  }

  // ================= UPDATE WORKER =================
  if (req.method === 'PUT') {
    const allowed = await hasPermission(user.userId, 'worker:edit');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { id, ...data } = req.body;

    const existing = await pool.query(
      `SELECT * FROM workers WHERE id = $1`,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const oldData = existing.rows[0];

    const updated = await pool.query(
      `
      UPDATE workers SET
        full_name = $1,
        phone = $2,
        email = $3,
        department_id = $4,
        salary = $5,
        join_date = $6,
        location = $7,
        image_url = $8,
        is_active = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
      `,
      [
        data.full_name,
        data.phone,
        data.email,
        data.department_id,
        data.salary,
        data.join_date,
        data.location,
        data.image_url,
        data.is_active,
        id,
      ]
    );

    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'worker',
      targetId: id,
      oldData,
      newData: updated.rows[0],
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json(updated.rows[0]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});