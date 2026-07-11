import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createNotificationForUser } from '@/lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'hardcoded-secret-2026';

// ✅ Helper to get client IP
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

  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password required' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.phone, u.password, u.branch_id, u.force_password_reset,
              u.two_factor_enabled, u.two_factor_secret, u.status,
              r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.phone = $1 AND u.deleted_at IS NULL`,
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account is not active. Please contact support.' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ 2FA enabled → send temp token
    if (user.two_factor_enabled && user.two_factor_secret) {
      const tempToken = jwt.sign(
        { 
          userId: user.id, 
          step: '2fa',
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      return res.status(200).json({
        requiresTwoFactor: true,
        tempToken,
        userId: user.id,
        phone: user.phone,
        message: 'Two-factor authentication required',
        expiresIn: 600
      });
    }

    // ✅ No 2FA → issue full token and send login notification
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        branchId: user.branch_id,
        fullName: user.full_name,
        forceReset: user.force_password_reset,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Create login notification (skip if 2FA flow)
    await createNotificationForUser(
      user.id,
      `🔐 New Login`,
      `You logged in from ${getClientIp(req)} at ${new Date().toLocaleString()}`,
      'system',
      'low'
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        role: user.role,
        branchId: user.branch_id,
        forceReset: user.force_password_reset,
        phone: user.phone,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
}