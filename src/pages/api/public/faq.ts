import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

// Define the FAQ type
interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

// Define cache with proper type
let cachedFaqs: FAQ[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION: number = 60 * 1000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return cached data if still fresh
  if (cachedFaqs && (Date.now() - cacheTime) < CACHE_DURATION) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(cachedFaqs);
  }

  try {
    const result = await pool.query(`
      SELECT id, question, answer, category, sort_order
      FROM faq_items
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `);
    
    cachedFaqs = result.rows as FAQ[];
    cacheTime = Date.now();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(cachedFaqs);
  } catch (error) {
    console.error('FAQ API error:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}