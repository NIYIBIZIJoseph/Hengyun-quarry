import { verifyToken } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

/**
 * LEGACY SAFE LAYER
 * Used ONLY during migration
 */

export async function getUser(req: any) {
  return await verifyToken(req);
}

export { hasPermission };