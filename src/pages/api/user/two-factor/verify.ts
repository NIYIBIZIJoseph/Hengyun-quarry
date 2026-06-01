import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";
import { logAudit } from '@/lib/audit';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { secret, code } = req.body;

    if (!secret || !code) {
      return res.status(400).json({ error: 'Secret and verification code are required' });
    }

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString()
    );

    // Save to database
    await pool.query(
      `UPDATE users
       SET two_factor_secret = $1,
           two_factor_backup_codes = $2,
           two_factor_enabled = true
       WHERE id = $3`,
      [secret, backupCodes, user.userId]
    );

    await logAudit({
      userId: user.userId,
      action: 'ENABLE_2FA',
      targetType: 'user',
      targetId: user.userId,
      newData: { two_factor_enabled: true },
      ipAddress: req.headers['x-forwarded-for'] as string,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully!',
      backupCodes
    });
  } catch (error: any) {
    console.error('2FA verify error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify 2FA setup' });
  }
});