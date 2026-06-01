import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { enforceBranchIsolation } from "@/lib/branch";
import { createNotification, createNotificationForAllAdmins } from '@/lib/notifications';
import { ROLES } from "@/lib/roles";

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

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

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

    // ✅ NOTIFICATION: New worker added
    await createNotificationForAllAdmins(
      "👷 New Worker Added",
      `${full_name} has been added to the workforce`,
      "worker",
      "low",
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

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const existing = await pool.query(
      `SELECT * FROM workers WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const oldData = existing.rows[0];

    const updated = await pool.query(
      `
      UPDATE workers SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        department_id = COALESCE($4, department_id),
        salary = COALESCE($5, salary),
        join_date = COALESCE($6, join_date),
        location = COALESCE($7, location),
        image_url = COALESCE($8, image_url),
        is_active = COALESCE($9, is_active),
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

    const worker = updated.rows[0];

    // ✅ NOTIFICATION: Worker status changed (active/inactive)
    if (oldData.is_active !== worker.is_active) {
      const statusMessage = worker.is_active ? 'activated' : 'deactivated';
      await createNotificationForAllAdmins(
        "👷 Worker Status Changed",
        `${worker.full_name} has been ${statusMessage}`,
        "worker",
        "medium",
        `/dashboard/workers/${worker.id}`
      );
    }

    await logAudit({
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'worker',
      targetId: id,
      oldData,
      newData: worker,
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json(worker);
  }

  // ================= DELETE WORKER =================
  if (req.method === 'DELETE') {
    const allowed = await hasPermission(user.userId, 'worker:delete');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const worker = await pool.query(
      `SELECT full_name FROM workers WHERE id = $1`,
      [id]
    );

    await pool.query(
      `
      UPDATE workers
      SET deleted_at = NOW(),
          deleted_by = $1
      WHERE id = $2
      `,
      [user.userId, id]
    );

    // ✅ NOTIFICATION: Worker removed
    if (worker.rows[0]) {
      await createNotificationForAllAdmins(
        "👷 Worker Removed",
        `${worker.rows[0].full_name} has been removed from the workforce`,
        "worker",
        "medium"
      );
    }

    await logAudit({
      userId: user.userId,
      action: 'DELETE',
      targetType: 'worker',
      targetId: Number(id),
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});