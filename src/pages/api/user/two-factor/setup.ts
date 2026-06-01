import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch user phone from DB
    const userRes = await pool.query(
      `SELECT phone, email, full_name FROM users WHERE id = $1`,
      [user.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userRes.rows[0];
    const identifier = userData.phone || userData.email || userData.full_name || `user-${user.userId}`;

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `HENG YUN (${identifier})`,
      issuer: 'HENG YUN'
    });

    if (!secret.otpauth_url) {
      return res.status(500).json({ error: 'Failed to generate OTP auth URL' });
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString()
    );

    return res.status(200).json({
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qrCode,
      backupCodes
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    return res.status(500).json({ error: error.message || 'Failed to setup 2FA' });
  }
});