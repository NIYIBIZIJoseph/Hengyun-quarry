import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

// Define the Team Member type
interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
}

// Define cache with proper type
let cachedTeam: TeamMember[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION: number = 60 * 1000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return cached data if still fresh
  if (cachedTeam && (Date.now() - cacheTime) < CACHE_DURATION) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(cachedTeam);
  }

  try {
    const result = await pool.query(`
      SELECT id, name, role, bio, image_url, sort_order
      FROM team_members
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `);
    
    cachedTeam = result.rows as TeamMember[];
    cacheTime = Date.now();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(cachedTeam);
  } catch (error) {
    console.error('Team API error:', error);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
}