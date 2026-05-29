import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  const { id } = req.query;
  const ticketId = parseInt(id as string);

  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID' });
  }

  // =========================================================
  // PERMISSION CHECK (MOVED UP FOR SAFETY)
  // =========================================================
  const allowed = await hasPermission(user.userId, 'support:view');
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { whereClause, params: branchParams } =
    enforceBranchIsolation(user, 'st', 'branch_id');

  // =========================================================
  // VERIFY TICKET ACCESS
  // =========================================================
  const ticketRes = await pool.query(
    `
    SELECT * FROM support_tickets st
    WHERE st.id = $${branchParams.length + 1}
      AND st.deleted_at IS NULL
      ${whereClause}
    `,
    [...branchParams, ticketId]
  );

  if (ticketRes.rows.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = ticketRes.rows[0];

  // =========================================================
  // GET TICKET + REPLIES
  // =========================================================
  if (req.method === 'GET') {

    const replies = await pool.query(
      `
      SELECT *
      FROM support_replies
      WHERE ticket_id = $1
      ORDER BY created_at ASC
      `,
      [ticketId]
    );

    return res.status(200).json({
      ticket,
      replies: replies.rows
    });
  }

  // =========================================================
  // POST REPLY
  // =========================================================
  if (req.method === 'POST') {

    const replyAllowed = await hasPermission(user.userId, 'support:reply');
    if (!replyAllowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // FIX: AuthUser does NOT contain phone → fetch safely
    const userInfo = await pool.query(
      `SELECT full_name FROM users WHERE id = $1`,
      [user.userId]
    );

    const senderName = userInfo.rows[0]?.full_name || 'Staff';

    await pool.query(
      `
      INSERT INTO support_replies
      (ticket_id, sender_name, sender_role, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [ticketId, senderName, user.role, message]
    );

    await pool.query(
      `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`,
      [ticketId]
    );

    return res.status(201).json({ success: true });
  }

  // =========================================================
  // UPDATE TICKET
  // =========================================================
  if (req.method === 'PUT') {

    const manageAllowed = await hasPermission(user.userId, 'support:manage');
    if (!manageAllowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, priority, assigned_to } = req.body;

    await pool.query(
      `
      UPDATE support_tickets
      SET
        status = COALESCE($1, status),
        priority = COALESCE($2, priority),
        assigned_to = COALESCE($3, assigned_to),
        updated_at = NOW()
      WHERE id = $4
      `,
      [status, priority, assigned_to, ticketId]
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});