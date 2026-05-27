import { AuthUser } from './auth-types';
import { ROLES } from './roles';

export interface BranchFilter {
  whereClause: string;
  params: any[];
}

export function enforceBranchIsolation(
  user: AuthUser | null,
  tableAlias: string = '',
  columnName: string = 'branch_id'
): BranchFilter {

  // No authenticated user
  if (!user) {
    return {
      whereClause: ' AND 1=0',
      params: [],
    };
  }

  // Superadmin bypass
  if (user.role === ROLES.SUPERADMIN) {
    return {
      whereClause: '',
      params: [],
    };
  }

  // No branch assigned
  if (!user.branchId) {
    return {
      whereClause: ' AND 1=0',
      params: [],
    };
  }

  const prefix = tableAlias ? `${tableAlias}.` : '';

  return {
    whereClause: ` AND ${prefix}${columnName} = $1`,
    params: [user.branchId],
  };
}