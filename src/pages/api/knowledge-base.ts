import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { requireAuth } from '@/lib/middleware/requireAuth';
import { AuthUser } from '@/lib/auth';

export default requireAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  // ================= PUBLIC GET =================
  if (req.method === 'GET') {
    const { slug } = req.query;

    if (slug) {
      const result = await pool.query(
        `
        UPDATE knowledge_base 
        SET view_count = view_count + 1 
        WHERE slug = $1 
        RETURNING *
        `,
        [slug]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    const result = await pool.query(
      `
      SELECT id, title, slug, category, view_count, created_at 
      FROM knowledge_base 
      WHERE is_published = true 
      ORDER BY created_at DESC
      `
    );

    return res.status(200).json(result.rows);
  }

  // ================= POST =================
  if (req.method === 'POST') {

    const result = await pool.query(
      `
      INSERT INTO knowledge_base (title, slug, content, category) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
      `,
      [req.body.title, req.body.slug, req.body.content, req.body.category || null]
    );

    return res.status(201).json(result.rows[0]);
  }

  // ================= PUT =================
  if (req.method === 'PUT') {

    const { id, title, slug, content, category, is_published } = req.body;

    await pool.query(
      `
      UPDATE knowledge_base 
      SET title=$1, slug=$2, content=$3, category=$4, is_published=$5, updated_at=CURRENT_TIMESTAMP 
      WHERE id=$6
      `,
      [title, slug, content, category, is_published, id]
    );

    return res.status(200).json({ message: 'Updated' });
  }

  // ================= DELETE =================
  if (req.method === 'DELETE') {

    const { id } = req.query;

    await pool.query(`DELETE FROM knowledge_base WHERE id = $1`, [id]);

    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
});