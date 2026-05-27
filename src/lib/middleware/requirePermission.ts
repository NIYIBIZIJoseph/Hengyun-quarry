import type { NextApiRequest, NextApiResponse } from "next";
import { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<void> | void;

/**
 * PERMISSION MIDDLEWARE
 * Must be used AFTER requireAuth
 */
export function requirePermission(permission: string, handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    try {
      const allowed = await hasPermission(user.userId, permission);

      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return handler(req, res, user);
    } catch (err) {
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
}