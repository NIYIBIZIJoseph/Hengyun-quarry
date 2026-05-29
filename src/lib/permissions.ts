import pool from "@/lib/db";

/**
 * CORE PERMISSION CHECK (single source of truth)
 */
export async function hasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  const result = await pool.query(
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