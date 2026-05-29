import type { NextApiRequest, NextApiResponse } from "next";
import type { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<any> | any;

export function requirePermission(permission: string) {
  return (handler: Handler) => {
    return async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const allowed = await hasPermission(user.userId, permission);

      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return handler(req, res, user);
    };
  };
}