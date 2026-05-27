import type { AuthUser } from '@/lib/auth';
import { hasPermission, isSuperAdmin } from './auth';

export { hasPermission, isSuperAdmin };

export function requirePermission(
  user: AuthUser,
  permission: string
) {
  return hasPermission(user.userId, permission);
}