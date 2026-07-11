import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

function getTable(type: string): string {
  switch (type) {
    case "ticket":
      return "support_tickets";
    case "message":
      return "contact_messages";
    case "worker":
      return "workers";
    case "attendance":
      return "attendance";
    case "product":
      return "products";
    case "order":
      return "orders";
    case "user":
      return "users";
    case "branch":
      return "branches";
    case "department":
      return "departments";
    default:
      throw new Error("Invalid type");
  }
}

// Helper to safely extract client IP
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0] || '';
  return req.socket?.remoteAddress || '';
}

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {
  // ✅ Only allow POST method for bulk delete
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Check permission
  const allowed = await hasPermission(user.userId, "recycle:delete");
  if (!allowed) {
    return res.status(403).json({ 
      error: "Forbidden - You don't have permission to permanently delete items" 
    });
  }

  // ✅ Get items from request body
  const { items } = req.body;

  // ✅ Validate input
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: "No items provided for bulk delete" 
    });
  }

  // ✅ Validate each item has type and id
  for (const item of items) {
    if (!item.type || !item.id) {
      return res.status(400).json({ 
        error: "Each item must have type and id" 
      });
    }
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  try {
    const client = await pool.connect();
    let totalDeleted = 0;
    const deletedItems: { type: string; id: number }[] = [];
    const failedItems: { type: string; id: number; error: string }[] = [];

    try {
      await client.query("BEGIN");

      // ✅ Group items by type
      const itemsByType: Record<string, number[]> = {};
      for (const item of items) {
        if (!itemsByType[item.type]) {
          itemsByType[item.type] = [];
        }
        itemsByType[item.type].push(item.id);
      }

      // ✅ Process each type group
      for (const [type, ids] of Object.entries(itemsByType)) {
        try {
          const table = getTable(type);
          const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
          
          // ✅ Check if items exist and are soft-deleted
          const checkResult = await client.query(
            `SELECT id FROM ${table} WHERE id IN (${placeholders}) AND deleted_at IS NOT NULL`,
            ids
          );

          const existingIds = checkResult.rows.map((row: any) => row.id);
          const missingIds = ids.filter(id => !existingIds.includes(id));

          // ✅ Track missing items
          for (const missingId of missingIds) {
            failedItems.push({
              type,
              id: missingId,
              error: "Item not found in recycle bin"
            });
          }

          if (existingIds.length > 0) {
            // ✅ Delete existing items
            const deletePlaceholders = existingIds.map((_, i) => `$${i + 1}`).join(", ");
            await client.query(
              `DELETE FROM ${table} WHERE id IN (${deletePlaceholders}) AND deleted_at IS NOT NULL`,
              existingIds
            );

            // ✅ Log audit for each deleted item
            for (const itemId of existingIds) {
              await logAudit({
                userId: user.userId,
                action: "BULK_PERMANENT_DELETE",
                targetType: type,
                targetId: itemId,
                ipAddress: clientIp,
                userAgent: userAgent,
              });
              
              deletedItems.push({ type, id: itemId });
              totalDeleted++;
            }
          }
        } catch (err: any) {
          // ✅ If one type fails, log it but continue with others
          for (const id of ids) {
            failedItems.push({
              type,
              id,
              error: err.message || "Delete failed"
            });
          }
        }
      }

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: `${totalDeleted} item(s) permanently deleted`,
        deleted: deletedItems,
        failed: failedItems,
        totalDeleted,
        totalFailed: failedItems.length
      });

    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error("BULK DELETE ERROR:", err);
    return res.status(500).json({ 
      error: err.message || "Bulk delete failed" 
    });
  }
});