import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {

  // ================= GET - FAQs (Admin sees all, Public sees only active) =================
  if (req.method === 'GET') {
    try {
      // Check if user has admin permission for FAQ management
      const isAdmin = await hasPermission(user.userId, 'faq:manage');
      
      let query: string;
      const queryParams: any[] = [];
      
      if (isAdmin) {
        // ✅ ADMIN: Get ALL FAQs (including inactive ones)
        query = `
          SELECT id, question, answer, category, sort_order, is_active
          FROM faq_items
          ORDER BY is_active DESC, sort_order ASC, id ASC
        `;
      } else {
        // ✅ PUBLIC: Get only active FAQs
        query = `
          SELECT id, question, answer, category, sort_order, is_active
          FROM faq_items
          WHERE is_active = true
          ORDER BY sort_order ASC, id ASC
        `;
      }
      
      const result = await pool.query(query, queryParams);
      return res.status(200).json(result.rows);
      
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      return res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
  }

  // ================= AUTH CHECK for POST/PUT/DELETE =================
  const allowed = await hasPermission(user.userId, 'faq:manage');
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ================= POST - Create FAQ =================
  if (req.method === 'POST') {
    const { question, answer, category, sort_order } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer required' });
    }

    try {
      const result = await pool.query(
        `
        INSERT INTO faq_items (question, answer, category, sort_order, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
        `,
        [question, answer, category || null, sort_order || 0]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating FAQ:', error);
      return res.status(500).json({ error: 'Failed to create FAQ' });
    }
  }

  // ================= PUT - Update FAQ =================
  if (req.method === 'PUT') {
    const { id, question, answer, category, sort_order, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID required' });
    }

    try {
      // First check if FAQ exists
      const check = await pool.query(
        `SELECT id FROM faq_items WHERE id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }

      await pool.query(
        `
        UPDATE faq_items
        SET 
          question = COALESCE($1, question),
          answer = COALESCE($2, answer),
          category = $3,
          sort_order = COALESCE($4, sort_order),
          is_active = COALESCE($5, is_active)
        WHERE id = $6
        `,
        [question, answer, category || null, sort_order, is_active, id]
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating FAQ:', error);
      return res.status(500).json({ error: 'Failed to update FAQ' });
    }
  }

  // ================= DELETE - Delete FAQ =================
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID required' });
    }

    try {
      // First check if FAQ exists
      const check = await pool.query(
        `SELECT id FROM faq_items WHERE id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }

      await pool.query(
        `DELETE FROM faq_items WHERE id = $1`,
        [id]
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      return res.status(500).json({ error: 'Failed to delete FAQ' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});