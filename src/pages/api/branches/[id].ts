import type {
  NextApiRequest,
  NextApiResponse,
} from 'next';

import pool from '@/lib/db';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
  ) => {

    // =========================================
    // VALIDATE ID
    // =========================================
    const { id } = req.query;

    const branchId = Number(id);

    if (!branchId || isNaN(branchId)) {
      return res.status(400).json({
        error: 'Invalid branch ID',
      });
    }

    try {

      // =========================================
      // UPDATE BRANCH
      // =========================================
      if (req.method === 'PUT') {

        const allowed =
          await hasPermission(
            user.userId,
            'branch:edit'
          );

        if (!allowed) {
          return res.status(403).json({
            error: 'Forbidden',
          });
        }

        const {
          name,
          location,
        } = req.body;

        if (!name) {
          return res.status(400).json({
            error: 'Name required',
          });
        }

        const existing =
          await pool.query(
            `
            SELECT id
            FROM branches
            WHERE id = $1
              AND deleted_at IS NULL
            `,
            [branchId]
          );

        if (
          existing.rows.length === 0
        ) {
          return res.status(404).json({
            error: 'Branch not found',
          });
        }

        await pool.query(
          `
          UPDATE branches
          SET
            name = $1,
            location = $2,
            updated_at = NOW()
          WHERE id = $3
          `,
          [
            name,
            location || null,
            branchId,
          ]
        );

        await logAudit({
          userId: user.userId,
          action: 'UPDATE_BRANCH',
          targetType: 'branch',
          targetId: branchId,

          newData: {
            name,
            location,
          },

          ipAddress:
            (req.headers[
              'x-forwarded-for'
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers[
              'user-agent'
            ],
        });

        return res.status(200).json({
          success: true,
        });
      }

      // =========================================
      // DELETE BRANCH
      // =========================================
      if (req.method === 'DELETE') {

        const allowed =
          await hasPermission(
            user.userId,
            'branch:delete'
          );

        if (!allowed) {
          return res.status(403).json({
            error: 'Forbidden',
          });
        }

        const usage =
          await pool.query(
            `
            SELECT
              (
                (SELECT COUNT(*)
                 FROM users
                 WHERE branch_id = $1
                   AND deleted_at IS NULL)

                +

                (SELECT COUNT(*)
                 FROM orders
                 WHERE branch_id = $1
                   AND deleted_at IS NULL)

                +

                (SELECT COUNT(*)
                 FROM workers
                 WHERE branch_id = $1
                   AND deleted_at IS NULL)
              ) AS total
            `,
            [branchId]
          );

        if (
          Number(
            usage.rows[0].total
          ) > 0
        ) {
          return res.status(409).json({
            error:
              'Cannot delete branch with existing records',
          });
        }

        await pool.query(
          `
          UPDATE branches
          SET
            deleted_at = NOW(),
            deleted_by = $1
          WHERE id = $2
          `,
          [
            user.userId,
            branchId,
          ]
        );

        await logAudit({
          userId: user.userId,
          action: 'DELETE_BRANCH',
          targetType: 'branch',
          targetId: branchId,

          ipAddress:
            (req.headers[
              'x-forwarded-for'
            ] as string) ||
            req.socket.remoteAddress,

          userAgent:
            req.headers[
              'user-agent'
            ],
        });

        return res.status(200).json({
          success: true,
        });
      }

      // =========================================
      // METHOD NOT ALLOWED
      // =========================================
      return res.status(405).json({
        error: 'Method not allowed',
      });

    } catch (err: any) {

      console.error(
        'BRANCH API ERROR:',
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          'Internal server error',
      });
    }
  }
);