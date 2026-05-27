import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken, AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<void> | void;

/**
 * AUTH GUARD (production-safe)
 */
export function requireAuth(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await verifyToken(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    (req as any).user = user;

    return handler(req, res, user);
  };
}