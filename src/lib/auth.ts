import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";
import { ROLES, Role } from "./roles";

export interface AuthUser {
  userId: number;
  role?: Role;
  branchId?: number;
  permissions?: string[];
}

/**
 * VERIFY JWT TOKEN (single source of truth)
 */
export function verifyToken(req: NextApiRequest): AuthUser | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");

    return jwt.verify(token, secret) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * ROLE HELPERS (cleaned)
 */
export function hasRole(user: AuthUser | null, role: Role): boolean {
  return !!user && user.role === role;
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === ROLES.SUPERADMIN;
}