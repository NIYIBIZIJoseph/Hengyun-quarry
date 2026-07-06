// src/pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // ✅ Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Include both user-specific and global notifications
    const result = await pool.query(
      `
      SELECT 
        id, 
        title, 
        message, 
        type, 
        is_read, 
        created_at, 
        link, 
        priority
      FROM notifications
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY 
        priority = 'high' DESC,
        priority = 'urgent' DESC,
        created_at DESC
      LIMIT 50
      `,
      [user.userId]
    );

    // ✅ If no notifications table, return empty array gracefully
    if (!result || !result.rows) {
      return res.status(200).json([]);
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // ✅ If table doesn't exist, return empty array instead of error
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(200).json([]);
    }
    
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});