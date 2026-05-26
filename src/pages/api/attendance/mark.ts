import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (!await hasPermission(user.userId, 'attendance:override')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { worker_id, action, datetime } = req.body;
  if (!worker_id || !action) return res.status(400).json({ error: 'Missing worker_id or action' });

  const now = datetime ? new Date(datetime) : new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);

  // Get worker name for notification
  const workerResult = await pool.query(
    `SELECT full_name FROM workers WHERE id = $1`,
    [worker_id]
  );
  const workerName = workerResult.rows[0]?.full_name || 'Worker';

  try {
    if (action === 'checkin') {
      const settingsRes = await pool.query(`SELECT value FROM system_settings WHERE key = 'late_threshold_minutes'`);
      const lateThreshold = settingsRes.rows[0]?.value ? parseInt(settingsRes.rows[0].value) : 15;
      const workStart = '08:00:00';
      const isLate = time > workStart;
      
      await pool.query(
        `INSERT INTO attendance (worker_id, date, check_in, is_late, status)
         VALUES ($1, $2, $3, $4, 'present')
         ON CONFLICT (worker_id, date) DO UPDATE 
         SET check_in = EXCLUDED.check_in, is_late = EXCLUDED.is_late, status = 'present'`,
        [worker_id, date, time, isLate]
      );

      // ========== ADD NOTIFICATION ==========
      await createNotification({
        userId: user.userId,
        title: 'Attendance Check-in',
        message: `${workerName} checked in at ${time}${isLate ? ' (Late)' : ''}`,
        type: 'attendance',
        priority: isLate ? 'medium' : 'low',
        link: '/dashboard/attendance/weekly'
      });

    } else if (action === 'checkout') {
      await pool.query(
        `UPDATE attendance SET check_out = $1 WHERE worker_id = $2 AND date = $3`,
        [time, worker_id, date]
      );

      // ========== ADD NOTIFICATION ==========
      await createNotification({
        userId: user.userId,
        title: 'Attendance Check-out',
        message: `${workerName} checked out at ${time}`,
        type: 'attendance',
        priority: 'low',
        link: '/dashboard/attendance/weekly'
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    return res.status(200).json({ message: 'Success', date, time });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }
}