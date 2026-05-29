import type { NextApiRequest, NextApiResponse } from "next";
import { hasPermission } from "@/lib/permissions";
import type { AuthUser } from "@/lib/auth";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<any> | any;

/**
 * PERMISSION MIDDLEWARE
 * Requires requireAuth to run first
 */
export function withPermission(permission: string) {
  return function (handler: Handler) {
    return async (
      req: NextApiRequest,
      res: NextApiResponse
    ) => {
      const user = (req as any).user as AuthUser | undefined;

      // =====================================================
      // AUTH CHECK
      // =====================================================
      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      // =====================================================
      // PERMISSION CHECK
      // =====================================================
      const allowed = await hasPermission(
        user.userId,
        permission
      );

      if (!allowed) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      // =====================================================
      // EXECUTE HANDLER
      // =====================================================
      return handler(req, res, user);
    };
  };
}