import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from '@/lib/branch';
import { createNotificationForAllAdmins } from '@/lib/notifications';

function generateTicketNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${yyyy}${mm}${dd}-${random}`;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ================= GET =================
  if (req.method === 'GET') {

    const allowed = await hasPermission(user.userId, 'support:view');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { whereClause, params } =
      enforceBranchIsolation(user, 'st', 'branch_id');

    const result = await pool.query(
      `
      SELECT st.*
      FROM support_tickets st
      WHERE st.deleted_at IS NULL ${whereClause}
      ORDER BY st.created_at DESC
      `,
      params
    );

    return res.status(200).json(result.rows);
  }

  // ================= POST =================
  if (req.method === 'POST') {

    const allowed = await hasPermission(user.userId, 'support:create');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const { user_name, phone, subject, message, priority = 'medium' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const ticketNumber = generateTicketNumber();

    const result = await pool.query(
      `
      INSERT INTO support_tickets 
      (ticket_number, user_name, phone, subject, message, priority, status, branch_id, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,NOW())
      RETURNING *
      `,
      [
        ticketNumber,
        user_name || 'Anonymous',
        phone || null,
        subject,
        message,
        priority,
        user.branchId,
        user.userId
      ]
    );

    const newTicket = result.rows[0];

    await createNotificationForAllAdmins(
      'New Support Ticket',
      `Ticket #${ticketNumber}: ${subject}`,
      'support',
      priority === 'urgent' ? 'high' : 'medium',
      `/dashboard/support/${newTicket.id}`
    );

    return res.status(201).json(newTicket);
  }

  return res.status(405).end();
});