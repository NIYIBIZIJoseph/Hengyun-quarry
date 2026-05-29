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
    default:
      throw new Error("Invalid type");
  }
}

export default withAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthUser
) => {

  // =====================================================
  // GET RECYCLE BIN ITEMS
  // =====================================================
  if (req.method === "GET") {

    const allowed = await hasPermission(user.userId, "recycle:view");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const result = await pool.query(`
        SELECT
          id,
          'ticket' as type,
          deleted_at,
          deleted_by
        FROM support_tickets WHERE deleted_at IS NOT NULL

        UNION ALL

        SELECT
          id,
          'message' as type,
          deleted_at,
          deleted_by
        FROM contact_messages WHERE deleted_at IS NOT NULL

        UNION ALL

        SELECT
          id,
          'worker' as type,
          deleted_at,
          deleted_by
        FROM workers WHERE deleted_at IS NOT NULL

        UNION ALL

        SELECT
          id,
          'attendance' as type,
          deleted_at,
          deleted_by
        FROM attendance WHERE deleted_at IS NOT NULL

        UNION ALL

        SELECT
          id,
          'product' as type,
          deleted_at,
          deleted_by
        FROM products WHERE deleted_at IS NOT NULL

        UNION ALL

        SELECT
          id,
          'order' as type,
          deleted_at,
          deleted_by
        FROM orders WHERE deleted_at IS NOT NULL

        ORDER BY deleted_at DESC
      `);

      return res.status(200).json(result.rows);

    } catch (err: any) {
      console.error("RECYCLE BIN ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch recycle bin" });
    }
  }

  // =====================================================
  // RESTORE ITEM
  // =====================================================
  if (req.method === "POST") {

    const allowed = await hasPermission(user.userId, "recycle:restore");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({ error: "Type and ID required" });
    }

    const table = getTable(type);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
        UPDATE ${table}
        SET deleted_at = NULL,
            deleted_by = NULL
        WHERE id = $1
        `,
        [id]
      );

      await logAudit({
        userId: user.userId,
        action: "RESTORE",
        targetType: type,
        targetId: id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      await client.query("COMMIT");

      return res.status(200).json({ success: true });

    } catch (err) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Restore failed" });

    } finally {
      client.release();
    }
  }

  // =====================================================
  // PERMANENT DELETE
  // =====================================================
  if (req.method === "DELETE") {

    const allowed = await hasPermission(user.userId, "recycle:delete");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({ error: "Type and ID required" });
    }

    const table = getTable(type);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [id]
      );

      await logAudit({
        userId: user.userId,
        action: "PERMANENT_DELETE",
        targetType: type,
        targetId: id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      await client.query("COMMIT");

      return res.status(200).json({ success: true });

    } catch (err) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Delete failed" });

    } finally {
      client.release();
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
});