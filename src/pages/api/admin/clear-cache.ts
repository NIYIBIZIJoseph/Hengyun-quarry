import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  // =====================================================
  // METHOD CHECK
  // =====================================================
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // =====================================================
  // PERMISSION CHECK
  // =====================================================
  const allowed = await hasPermission(user.userId, "admin:controls");

  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // =====================================================
  // CACHE CLEAR (PLACEHOLDER LOGIC)
  // =====================================================
  try {

    // NOTE: real cache system (Redis / memory / CDN) should be added later
    console.log("Cache cleared (placeholder)");

    await logAudit({
      userId: user.userId,
      action: "CLEAR_CACHE",
      targetType: "system",
      ipAddress:
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: "Cache cleared (placeholder - implement Redis/CDN later)",
    });

  } catch (err: any) {
    console.error("CLEAR CACHE ERROR:", err);

    return res.status(500).json({
      error: "Failed to clear cache",
    });
  }
});