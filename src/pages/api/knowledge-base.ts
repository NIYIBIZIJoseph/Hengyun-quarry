import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // -------------------------
  // PUBLIC GET ROUTES
  // -------------------------
  if (req.method === 'GET') {
    const { slug } = req.query;

    if (slug) {
      const result = await pool.query(
        `UPDATE knowledge_base 
         SET view_count = view_count + 1 
         WHERE slug = $1 
         RETURNING *`,
        [slug]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    const result = await pool.query(
      `SELECT id, title, slug, category, view_count, created_at 
       FROM knowledge_base 
       WHERE is_published = true 
       ORDER BY created_at DESC`
    );

    return res.status(200).json(result.rows);
  }

  // -------------------------
  // AUTH CHECK (FIXED)
  // -------------------------
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // STRICT ADMIN ACCESS (role = 1 is SUPERADMIN in your system)
  if (user.role !== 1) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // -------------------------
  // POST: CREATE ARTICLE
  // -------------------------
  if (req.method === 'POST') {
    const { title, slug, content, category } = req.body;

    const result = await pool.query(
      `INSERT INTO knowledge_base (title, slug, content, category) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, slug, content, category || null]
    );

    return res.status(201).json(result.rows[0]);
  }

  // -------------------------
  // PUT: UPDATE ARTICLE
  // -------------------------
  if (req.method === 'PUT') {
    const { id, title, slug, content, category, is_published } = req.body;

    await pool.query(
      `UPDATE knowledge_base 
       SET title=$1, slug=$2, content=$3, category=$4, is_published=$5, updated_at=CURRENT_TIMESTAMP 
       WHERE id=$6`,
      [title, slug, content, category, is_published, id]
    );

    return res.status(200).json({ message: 'Updated' });
  }

  // -------------------------
  // DELETE ARTICLE
  // -------------------------
  if (req.method === 'DELETE') {
    const { id } = req.query;

    await pool.query(
      `DELETE FROM knowledge_base WHERE id = $1`,
      [id]
    );

    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}