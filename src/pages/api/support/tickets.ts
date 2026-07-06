import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from '@/lib/permissions';
import { enforceBranchIsolation } from '@/lib/branch';
import { AuthUser } from "@/lib/auth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {

  // ================= GET - All Tickets =================
  if (req.method === 'GET') {
    const allowed = await hasPermission(user.userId, 'support:view');
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { status, priority, search } = req.query;
    const { whereClause, params } = enforceBranchIsolation(user, 'st', 'branch_id');

    let query = `
      SELECT 
        st.id,
        st.ticket_number,
        st.user_name,
        st.phone,
        st.subject,
        st.message,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      WHERE st.deleted_at IS NULL
      ${whereClause}
    `;

    const queryParams = [...params];
    let paramIndex = params.length + 1;

    if (status) {
      query += ` AND st.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND st.priority = $${paramIndex}`;
      queryParams.push(priority);
      paramIndex++;
    }

    if (search) {
      query += ` AND (st.user_name ILIKE $${paramIndex} OR st.subject ILIKE $${paramIndex} OR st.phone ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY st.created_at DESC`;

    try {
      const result = await pool.query(query, queryParams);
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  // ================= POST - Create Ticket =================
  if (req.method === 'POST') {
    const allowed = await hasPermission(user.userId, 'support:create');
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { user_name, phone, subject, message, priority, category } = req.body;

    if (!user_name || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate ticket number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const ticketNumber = `TKT-${dateStr}-${random}`;

    try {
      const result = await pool.query(
        `
        INSERT INTO support_tickets 
        (ticket_number, user_name, phone, subject, message, priority, category, status, created_by, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9)
        RETURNING *
        `,
        [ticketNumber, user_name, phone, subject, message, priority || 'medium', category || 'general', user.userId, user.branchId || null]
      );

      return res.status(201).json({ success: true, ticket: result.rows[0] });
    } catch (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});