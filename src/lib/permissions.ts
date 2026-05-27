import pool from "@/lib/db";

/**
 * CENTRALIZED PERMISSION SYSTEM
 */
export async function hasPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = $1 AND p.name = $2
      LIMIT 1
      `,
      [userId, permission]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error("Permission check failed:", err);
    return false;
  }
}