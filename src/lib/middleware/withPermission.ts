import type { NextApiRequest, NextApiResponse } from "next";
import { hasPermission } from "@/lib/permissions";
import { AuthUser } from "@/lib/auth";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<void> | void;

export function withPermission(permission: string, handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
    const allowed = await hasPermission(user.userId, permission);

    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return handler(req, res, user);
  };
}