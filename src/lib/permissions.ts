import pool from "@/lib/db";

/**
 * CORE PERMISSION CHECK (single source of truth)
 */
export async function hasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  // ✅ If userId is invalid, deny access
  if (!userId) {
    console.warn('hasPermission called with invalid userId:', userId);
    return false;
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      SELECT 1
      FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
        AND p.name = $2
        AND u.deleted_at IS NULL
      LIMIT 1
      `,
      [userId, permission]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  } finally {
    if (client) client.release(); // ✅ Always release the client
  }
}

/**
 * MULTI-PERMISSION CHECK
 */
export async function hasAnyPermission(
  userId: number,
  permissions: string[]
): Promise<boolean> {
  for (const perm of permissions) {
    if (await hasPermission(userId, perm)) return true;
  }
  return false;
}

/**
 * GET ALL PERMISSIONS FOR A USER
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  if (!userId) return [];

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      SELECT p.name
      FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
        AND u.deleted_at IS NULL
      `,
      [userId]
    );
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  } finally {
    if (client) client.release();
  }
}