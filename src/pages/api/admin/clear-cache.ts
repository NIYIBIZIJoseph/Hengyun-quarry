import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserRoleFromToken } from '@/lib/auth-client';
import { logAudit } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const role = getUserRoleFromToken();

  // ⚠️ fallback user object (since no verifyToken exists)
  const userId = 1; // temporary fallback (you must improve later)

  const isAllowed =
    role === 'superadmin' || role === 'admin';

  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await logAudit({
    userId,
    action: 'CLEAR_CACHE',
    targetType: 'system',
    ipAddress: req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
  });

  return res.status(200).json({
    success: true,
    message: 'Cache clear logged (no cache implemented)',
  });
}