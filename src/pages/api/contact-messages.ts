import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
  
  // ================= GET - All messages =================
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT * FROM contact_messages ORDER BY created_at DESC`
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  // ================= POST - Create message (Public) =================
  if (req.method === 'POST') {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message required' });
    }
    try {
      await pool.query(
        `INSERT INTO contact_messages (name, email, phone, subject, message) 
         VALUES ($1, $2, $3, $4, $5)`,
        [name, email || null, phone || null, subject || null, message]
      );
      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to create message' });
    }
  }

  // ================= PUT - Mark as read =================
  if (req.method === 'PUT') {
    const { id, is_read } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID required' });
    }
    try {
      await pool.query(
        `UPDATE contact_messages SET is_read = $1 WHERE id = $2`,
        [is_read !== undefined ? is_read : true, id]
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({ error: 'Failed to update message' });
    }
  }

  // ================= DELETE - Delete message =================
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID required' });
    }
    try {
      await pool.query(
        `DELETE FROM contact_messages WHERE id = $1`,
        [id]
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});