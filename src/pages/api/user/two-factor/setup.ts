import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '@/lib/db';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== 'GET') return res.status(405).end();

  // ✅ FIX: fetch phone from DB instead of assuming it exists on AuthUser
  const userRes = await pool.query(
    `SELECT phone FROM users WHERE id = $1`,
    [user.userId]
  );

  const phone = userRes.rows[0]?.phone ?? 'unknown';

  const secret = speakeasy.generateSecret({
    length: 20,
    name: `HENG YUN (${phone})`,
    issuer: 'HENG YUN'
  });

  if (!secret.otpauth_url) {
    return res.status(500).json({ error: 'Failed to generate OTP auth URL' });
  }

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return res.status(200).json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
    qrCode,
  });
});