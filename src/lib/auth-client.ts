import type { Role } from './roles';
import { ROLES } from './roles';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getUserRoleFromToken = (): Role | null => {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
const role = String(payload.role || '').toUpperCase();

if (role === ROLES.SUPERADMIN.toUpperCase()) return ROLES.SUPERADMIN;
if (role === ROLES.ADMIN.toUpperCase()) return ROLES.ADMIN;
if (role === ROLES.SUPERVISOR.toUpperCase()) return ROLES.SUPERVISOR;
if (role === ROLES.SERVICE_PROVIDER.toUpperCase()) return ROLES.SERVICE_PROVIDER;

return null;
  } catch {
    return null;
  }
};

export const getUserBranchIdFromToken = (): number | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.branchId || null;
  } catch {
    return null;
  }
};