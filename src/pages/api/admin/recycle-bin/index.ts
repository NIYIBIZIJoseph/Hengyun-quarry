import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { AuthUser } from "@/lib/auth";

function getTable(type: string): string {
  switch (type) {
    case "ticket": return "support_tickets";
    case "message": return "contact_messages";
    case "worker": return "workers";
    case "attendance": return "attendance";
    case "product": return "products";
    case "order": return "orders";
    case "user": return "users";
    case "branch": return "branches";
    case "department": return "departments";
    default: throw new Error("Invalid type");
  }
}

// ✅ Helper to safely extract client IP
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded;
  if (Array.isArray(forwarded)) return forwarded[0] || '';
  return req.socket?.remoteAddress || '';
}

// ✅ Inline dependency checker (no external file needed)
async function checkDependencies(table: string, id: number): Promise<{ table: string; count: number; column?: string }[]> {
  const client = await pool.connect();
  try {
    const dependencies: { table: string; count: number; column?: string }[] = [];

    // ===== USER DEPENDENCIES =====
    if (table === 'users') {
      const checks = [
        { table: 'user_preferences', column: 'user_id' },
        { table: 'notifications', column: 'user_id' },
        { table: 'activity_logs', column: 'user_id' },
        { table: 'user_activity', column: 'user_id' },
        { table: 'audit_logs', column: 'user_id' },
        { table: 'support_tickets', column: 'created_by', condition: 'created_by = $1 OR assigned_to = $1' },
        { table: 'support_messages', column: 'sender_id' },
        { table: 'support_replies', column: 'user_id' },
        { table: 'stock_logs', column: 'changed_by' },
        { table: 'stock_movements', column: 'user_id' },
        { table: 'branch_settings', column: 'updated_by' },
        { table: 'branches', column: 'deleted_by' },
        { table: 'leave_requests', column: 'approved_by' },
        { table: 'system_settings', column: 'updated_by' },
        { table: 'attendance', column: 'user_id' },
        { table: 'orders', column: 'deleted_by' },
        { table: 'products', column: 'deleted_by' },
        { table: 'workers', column: 'deleted_by' },
        { table: 'contact_messages', column: 'deleted_by' },
        { table: 'departments', column: 'deleted_by' },
      ];

      for (const check of checks) {
        try {
          let query: string;
          if (check.condition) {
            query = `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.condition}`;
          } else {
            query = `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`;
          }
          const result = await client.query(query, [id]);
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    // ===== PRODUCT DEPENDENCIES =====
    if (table === 'products') {
      const checks = [
        { table: 'order_items', column: 'product_id' },
        { table: 'stock_logs', column: 'product_id' },
        { table: 'stock_movements', column: 'product_id' },
        { table: 'inventory', column: 'product_id' },
        { table: 'support_tickets', column: 'product_id' },
      ];

      for (const check of checks) {
        try {
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`,
            [id]
          );
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    // ===== ORDER DEPENDENCIES =====
    if (table === 'orders') {
      const checks = [
        { table: 'order_items', column: 'order_id' },
        { table: 'support_tickets', column: 'order_id' },
      ];

      for (const check of checks) {
        try {
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`,
            [id]
          );
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    // ===== WORKER DEPENDENCIES =====
    if (table === 'workers') {
      const checks = [
        { table: 'attendance', column: 'worker_id' },
        { table: 'leave_requests', column: 'worker_id' },
        { table: 'performance_reviews', column: 'worker_id' },
        { table: 'worker_documents', column: 'worker_id' },
        { table: 'salary_history', column: 'worker_id' },
        { table: 'worker_shifts', column: 'worker_id' },
      ];

      for (const check of checks) {
        try {
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`,
            [id]
          );
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    // ===== SUPPORT TICKET DEPENDENCIES =====
    if (table === 'ticket' || table === 'support_tickets') {
      const checks = [
        { table: 'support_messages', column: 'ticket_id' },
        { table: 'support_replies', column: 'ticket_id' },
        { table: 'support_attachments', column: 'ticket_id' },
      ];

      for (const check of checks) {
        try {
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`,
            [id]
          );
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    // ===== BRANCH DEPENDENCIES =====
    if (table === 'branches') {
      const checks = [
        { table: 'users', column: 'branch_id' },
        { table: 'workers', column: 'branch_id' },
        { table: 'orders', column: 'branch_id' },
        { table: 'products', column: 'branch_id' },
        { table: 'inventory', column: 'branch_id' },
        { table: 'stock_movements', column: 'branch_id' },
        { table: 'support_tickets', column: 'branch_id' },
        { table: 'contact_messages', column: 'branch_id' },
        { table: 'attendance', column: 'branch_id' },
        { table: 'branch_settings', column: 'branch_id' },
      ];

      for (const check of checks) {
        try {
          const result = await client.query(
            `SELECT COUNT(*) as count FROM ${check.table} WHERE ${check.column} = $1`,
            [id]
          );
          if (parseInt(result.rows[0].count) > 0) {
            dependencies.push({
              table: check.table,
              count: parseInt(result.rows[0].count),
              column: check.column
            });
          }
        } catch (err: any) {
          // Table might not exist, skip
        }
      }
    }

    return dependencies;
  } finally {
    client.release();
  }
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => {
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  // ===== GET =====
  if (req.method === "GET") {
    const allowed = await hasPermission(user.userId, "recycle:view");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const result = await pool.query(`
        SELECT 
          id, type, deleted_at, deleted_by,
          CASE 
            WHEN type = 'ticket' THEN (SELECT subject FROM support_tickets WHERE id = t.id)
            WHEN type = 'message' THEN (SELECT subject FROM contact_messages WHERE id = t.id)
            WHEN type = 'worker' THEN (SELECT full_name FROM workers WHERE id = t.id)
            WHEN type = 'attendance' THEN (SELECT CONCAT('Worker: ', worker_id) FROM attendance WHERE id = t.id)
            WHEN type = 'product' THEN (SELECT name FROM products WHERE id = t.id)
            WHEN type = 'order' THEN (SELECT order_number FROM orders WHERE id = t.id)
            WHEN type = 'user' THEN (SELECT full_name FROM users WHERE id = t.id)
            WHEN type = 'branch' THEN (SELECT name FROM branches WHERE id = t.id)
            WHEN type = 'department' THEN (SELECT name FROM departments WHERE id = t.id)
            ELSE 'Unknown'
          END as name
        FROM (
          SELECT id, 'ticket' as type, deleted_at, deleted_by FROM support_tickets WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'message' as type, deleted_at, deleted_by FROM contact_messages WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'worker' as type, deleted_at, deleted_by FROM workers WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'attendance' as type, deleted_at, deleted_by FROM attendance WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'product' as type, deleted_at, deleted_by FROM products WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'order' as type, deleted_at, deleted_by FROM orders WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'user' as type, deleted_at, deleted_by FROM users WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'branch' as type, deleted_at, deleted_by FROM branches WHERE deleted_at IS NOT NULL
          UNION ALL
          SELECT id, 'department' as type, deleted_at, deleted_by FROM departments WHERE deleted_at IS NOT NULL
        ) t
        ORDER BY deleted_at DESC
      `);

      return res.status(200).json(result.rows);
    } catch (err: any) {
      console.error("RECYCLE BIN GET ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch recycle bin" });
    }
  }

  // ===== POST (Restore) =====
  if (req.method === "POST") {
    const allowed = await hasPermission(user.userId, "recycle:restore");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { type, id } = req.body;
    if (!type || !id) {
      return res.status(400).json({ error: "Type and ID required" });
    }

    try {
      const table = getTable(type);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const check = await client.query(
          `SELECT id FROM ${table} WHERE id = $1 AND deleted_at IS NOT NULL`,
          [id]
        );
        if (check.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Item not found in recycle bin" });
        }

        await client.query(
          `UPDATE ${table} SET deleted_at = NULL, deleted_by = NULL WHERE id = $1`,
          [id]
        );

        await logAudit({
          userId: user.userId,
          action: "RESTORE",
          targetType: type,
          targetId: id,
          ipAddress: clientIp,
          userAgent: userAgent,
        });

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: "Item restored successfully" });
      } catch (err: any) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("RESTORE ERROR:", err);
      return res.status(500).json({ error: err.message || "Restore failed" });
    }
  }

  // ===== DELETE (Permanent) =====
  if (req.method === "DELETE") {
    const allowed = await hasPermission(user.userId, "recycle:delete");
    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { type, id, ids } = req.body;
    const itemsToDelete = ids || (id ? [id] : []);
    if (!type || itemsToDelete.length === 0) {
      return res.status(400).json({ error: "Type and at least one ID required" });
    }

    const table = getTable(type);

    try {
      const client = await pool.connect();
      let deletedCount = 0;
      const failedItems = [];

      try {
        await client.query("BEGIN");

        for (const itemId of itemsToDelete) {
          const check = await client.query(
            `SELECT id FROM ${table} WHERE id = $1 AND deleted_at IS NOT NULL`,
            [itemId]
          );
          if (check.rows.length === 0) {
            failedItems.push({ id: itemId, error: "Item not found in recycle bin" });
            continue;
          }

          const deps = await checkDependencies(table, itemId);
          if (deps.length > 0) {
            const depList = deps.map(d => `${d.table} (${d.count})`).join(', ');
            failedItems.push({
              id: itemId,
              error: `Cannot delete: referenced in ${depList}`,
              dependencies: deps
            });
            continue;
          }

          await client.query(`DELETE FROM ${table} WHERE id = $1 AND deleted_at IS NOT NULL`, [itemId]);
          await logAudit({
            userId: user.userId,
            action: "PERMANENT_DELETE",
            targetType: type,
            targetId: itemId,
            ipAddress: clientIp,
            userAgent: userAgent,
          });
          deletedCount++;
        }

        await client.query("COMMIT");

        if (failedItems.length > 0) {
          return res.status(207).json({
            success: deletedCount > 0,
            message: `${deletedCount} item(s) deleted, ${failedItems.length} failed`,
            deleted: deletedCount,
            failed: failedItems,
            failedCount: failedItems.length
          });
        }

        return res.status(200).json({
          success: true,
          message: `${deletedCount} item(s) permanently deleted`,
          deleted: deletedCount,
          failed: [],
          failedCount: 0
        });
      } catch (err: any) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("PERMANENT DELETE ERROR:", err);
      return res.status(500).json({
        error: err.message || "Delete failed",
        code: err.code
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
});