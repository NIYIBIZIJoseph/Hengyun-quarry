import type { AuthUser } from "@/lib/auth";

import { hasPermission } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/auth";

/**
 * =========================================================
 * RBAC CORE (single source of truth)
 * =========================================================
 */

// Re-export core utilities
export { hasPermission, isSuperAdmin };

/**
 * Check permission
 */
export async function checkPermission(
  user: AuthUser,
  permission: string
): Promise<boolean> {
  return hasPermission(user.userId, permission);
}

/**
 * Check super admin status
 */
export function checkSuperAdmin(user: AuthUser): boolean {
  return isSuperAdmin(user);
}