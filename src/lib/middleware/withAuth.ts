import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken, AuthUser } from "@/lib/auth";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => Promise<any> | any;

export function withAuth(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = verifyToken(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    (req as any).user = user;

    return handler(req, res, user);
  };
}