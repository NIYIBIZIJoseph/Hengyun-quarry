import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

export type AuthUser = {
  userId: number;
  role?: string;
  branchId?: number | null;
  permissions?: string[];
};

/**
 * SINGLE SOURCE OF TRUTH: JWT verification
 * - async (consistent with middleware design)
 * - never throws to callers
 * - always returns AuthUser | null
 */
export async function verifyToken(
  req: NextApiRequest
): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthUser;

    // hard safety normalization (prevents broken tokens)
    if (!decoded?.userId) return null;

    return decoded;
  } catch (err) {
    return null;
  }
}