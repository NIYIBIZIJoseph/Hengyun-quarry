import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware/withAuth';
import { logAudit } from '@/lib/audit';

export const config = {
  api: { bodyParser: { sizeLimit: '3mb' } },
};

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: any) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body as { image?: string };

    // ✅ Remove avatar (empty string)
    if (image === '') {
      await pool.query(
        `UPDATE users SET avatar_url = NULL WHERE id = $1`,
        [user.userId]
      );
      await logAudit({
        userId: user.userId,
        action: 'REMOVE_AVATAR',
        targetType: 'user',
        targetId: user.userId,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      return res.status(200).json({ success: true, avatar_url: '' });
    }

    // ✅ Validate image data
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // ✅ Size check (~2MB after base64 decode)
    if (image.length > 3_000_000) {
      return res.status(413).json({ error: 'Image too large (max 2MB)' });
    }

    // ✅ Only update avatar_url — it's TEXT and can hold base64
    await pool.query(
      `UPDATE users 
       SET avatar_url = $1::text 
       WHERE id = $2`,
      [image, user.userId]
    );

    await logAudit({
      userId: user.userId,
      action: 'UPDATE_AVATAR',
      targetType: 'user',
      targetId: user.userId,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ success: true, avatar_url: image });
  } catch (err: any) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});