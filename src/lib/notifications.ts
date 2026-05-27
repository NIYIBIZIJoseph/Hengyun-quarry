import pool from './db';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  link?: string;
}

export async function createNotification(data: NotificationData): Promise<void>;
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type?: string,
  priority?: 'high' | 'medium' | 'low',
  link?: string
): Promise<void>;

export async function createNotification(
  userIdOrData: number | NotificationData,
  title?: string,
  message?: string,
  type: string = 'system',
  priority: 'high' | 'medium' | 'low' = 'medium',
  link?: string
): Promise<void> {
  let userId: number;
  let finalTitle: string;
  let finalMessage: string;
  let finalType: string;
  let finalPriority: 'high' | 'medium' | 'low';
  let finalLink: string | undefined;

  if (typeof userIdOrData === 'object') {
    userId = userIdOrData.userId;
    finalTitle = userIdOrData.title;
    finalMessage = userIdOrData.message;
    finalType = userIdOrData.type || 'system';
    finalPriority = userIdOrData.priority || 'medium';
    finalLink = userIdOrData.link;
  } else {
    userId = userIdOrData;
    finalTitle = title || '';
    finalMessage = message || '';
    finalType = type;
    finalPriority = priority;
    finalLink = link;
  }

  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, created_at, link, is_read)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, false)`,
      [userId, finalTitle, finalMessage, finalType, finalPriority, finalLink]
    );
    console.log(`✅ Notification created for user ${userId}: ${finalTitle}`);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createNotificationForRole(
  roleId: number,
  title: string,
  message: string,
  type: string = 'system',
  priority: 'high' | 'medium' | 'low' = 'medium',
  link?: string
) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, created_at, link, is_read)
       SELECT id, $1, $2, $3, $4, NOW(), $5, false
       FROM users WHERE role_id = $6 AND deleted_at IS NULL`,
      [title, message, type, priority, link, roleId]
    );
    console.log(`✅ Notification created for role ${roleId}: ${title}`);
  } catch (error) {
    console.error('Failed to create role notification:', error);
  }
}

export async function createNotificationForAllAdmins(
  title: string,
  message: string,
  type: string = 'system',
  priority: 'high' | 'medium' | 'low' = 'medium',
  link?: string
) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, created_at, link, is_read)
       SELECT id, $1, $2, $3, $4, NOW(), $5, false
       FROM users WHERE role_id IN (1, 4) AND deleted_at IS NULL`,
      [title, message, type, priority, link]
    );
    console.log(`✅ Notification created for all admins: ${title}`);
  } catch (error) {
    console.error('Failed to create admin notification:', error);
  }
}
