import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { logAudit } from '@/lib/audit';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') return res.status(405).end();

  await pool.query(
    `UPDATE users
     SET two_factor_secret = NULL,
         two_factor_backup_codes = NULL,
         two_factor_enabled = false
     WHERE id = $1`,
    [user.userId]
  );

  await logAudit({
    userId: user.userId,
    action: 'DISABLE_2FA',
    targetType: 'user',
    targetId: user.userId,
    newData: { two_factor_enabled: false },
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  return res.status(200).json({
    success: true,
    message: '2FA disabled'
  });
});