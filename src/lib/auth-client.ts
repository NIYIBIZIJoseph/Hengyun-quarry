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
    const role = payload.role;
    
    // Return the role as is - it should match ROLES values
    if (role === ROLES.SUPERADMIN) return ROLES.SUPERADMIN;
    if (role === ROLES.ADMIN) return ROLES.ADMIN;
    if (role === ROLES.SUPERVISOR) return ROLES.SUPERVISOR;
    if (role === ROLES.SERVICE_PROVIDER) return ROLES.SERVICE_PROVIDER;
    
    return role as Role;
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