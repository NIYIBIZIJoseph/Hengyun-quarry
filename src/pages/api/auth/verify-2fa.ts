import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { createNotificationForUser } from '@/lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0] || '';
  return req.socket?.remoteAddress || '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Missing temporary token or code' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET) as { userId: number; step: string };
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Verification token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        error: 'Invalid verification token.',
        code: 'INVALID_TOKEN'
      });
    }

    if (decoded.step !== '2fa') {
      return res.status(400).json({ error: 'Invalid token step' });
    }

    const userRes = await pool.query(
      `SELECT u.id, u.two_factor_secret, u.full_name, u.branch_id, u.role_id, u.phone,
              r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userRes.rows[0];

    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA not set up for this user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
    
    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        branchId: user.branch_id,
        fullName: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Send login notification (2FA success)
    await createNotificationForUser(
      user.id,
      `🔐 New Login (2FA)`,
      `You logged in with 2FA from ${getClientIp(req)} at ${new Date().toLocaleString()}`,
      'system',
      'low'
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        full_name: user.full_name,
        role: user.role,
        branchId: user.branch_id,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('2FA Verification Error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}