import type { NextApiRequest, NextApiResponse } from "next";

import { verifyToken, AuthUser } from "@/lib/auth";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<any> | any;

/**
 * CENTRAL AUTH GUARD
 * - verifies JWT
 * - injects authenticated user
 * - blocks unauthorized requests
 */
export function requireAuth(handler: Handler) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    try {
      const user = await verifyToken(req);

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      // optional request attachment
      (req as any).user = user;

      return handler(req, res, user);

    } catch (err) {
      console.error("AUTH ERROR:", err);

      return res.status(500).json({
        error: "Authentication failed",
      });
    }
  };
}