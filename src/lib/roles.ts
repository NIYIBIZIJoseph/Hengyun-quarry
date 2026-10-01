export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];