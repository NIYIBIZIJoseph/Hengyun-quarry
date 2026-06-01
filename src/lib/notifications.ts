import pool from './db';

export async function createNotification({
  userId,
  title,
  message,
  type = 'system',
  priority = 'medium',
  link,
}: {
  userId: number;
  title: string;
  message: string;
  type?: 'order' | 'support' | 'attendance' | 'alert' | 'product' | 'worker' | 'system';
  priority?: 'high' | 'medium' | 'low';
  link?: string;
}) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, link, created_at, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
      [userId, title, message, type, priority, link]
    );
    console.log(`✅ Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createNotificationForAllAdmins(
  title: string,
  message: string,
  type: 'order' | 'support' | 'attendance' | 'alert' | 'product' | 'worker' | 'system' = 'system',
  priority: 'high' | 'medium' | 'low' = 'medium',
  link?: string
) {
  try {
    // Get all admin users (superadmin and admin roles)
    const result = await pool.query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('superadmin', 'admin') AND u.deleted_at IS NULL`
    );
    
    for (const admin of result.rows) {
      await createNotification({
        userId: admin.id,
        title,
        message,
        type,
        priority,
        link,
      });
    }
    console.log(`✅ Notification sent to ${result.rows.length} admins: ${title}`);
  } catch (error) {
    console.error('Failed to create admin notifications:', error);
  }
}

export async function createNotificationForUser(
  userId: number,
  title: string,
  message: string,
  type: 'order' | 'support' | 'attendance' | 'alert' | 'product' | 'worker' | 'system' = 'system',
  priority: 'high' | 'medium' | 'low' = 'medium',
  link?: string
) {
  await createNotification({ userId, title, message, type, priority, link });
}