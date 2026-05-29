import type { NextApiRequest, NextApiResponse } from "next";

import pool from "@/lib/db";

import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";
import { enforceBranchIsolation } from "@/lib/branch";

export default withAuth(
  async (req: NextApiRequest, res: NextApiResponse, user: any) => {

    // =========================================
    // GET LEAVE REQUESTS
    // =========================================
    if (req.method === "GET") {

      const allowed = await hasPermission(
        user.userId,
        "attendance:view"
      );

      if (!allowed) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      try {

        const { worker_id } = req.query;

        const { whereClause, params } =
          enforceBranchIsolation(
            user,
            "w",
            "branch_id"
          );

        let query = `
          SELECT
            l.*,
            w.full_name AS worker_name
          FROM leave_requests l
          JOIN workers w
            ON l.worker_id = w.id
          WHERE w.deleted_at IS NULL
          ${whereClause}
        `;

        const queryParams: any[] = [...params];

        if (worker_id) {
          query += `
            AND l.worker_id = $${queryParams.length + 1}
          `;

          queryParams.push(worker_id);
        }

        query += `
          ORDER BY l.created_at DESC
        `;

        const result = await pool.query(
          query,
          queryParams
        );

        return res.status(200).json(
          result.rows
        );

      } catch (err: any) {

        console.error(
          "LEAVE GET ERROR:",
          err
        );

        return res.status(500).json({
          error:
            err.message ||
            "Internal server error",
        });
      }
    }

    // =========================================
    // CREATE LEAVE REQUEST
    // =========================================
    if (req.method === "POST") {

      const allowed = await hasPermission(
        user.userId,
        "attendance:override"
      );

      if (!allowed) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      try {

        const {
          worker_id,
          start_date,
          end_date,
          reason,
        } = req.body;

        if (
          !worker_id ||
          !start_date ||
          !end_date
        ) {
          return res.status(400).json({
            error:
              "Missing required fields",
          });
        }

        const result = await pool.query(
          `
          INSERT INTO leave_requests (
            worker_id,
            start_date,
            end_date,
            reason,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'pending'
          )
          RETURNING *
          `,
          [
            worker_id,
            start_date,
            end_date,
            reason || null,
          ]
        );

        return res.status(201).json(
          result.rows[0]
        );

      } catch (err: any) {

        console.error(
          "LEAVE CREATE ERROR:",
          err
        );

        return res.status(500).json({
          error:
            err.message ||
            "Internal server error",
        });
      }
    }

    // =========================================
    // UPDATE LEAVE STATUS
    // =========================================
    if (req.method === "PUT") {

      const allowed = await hasPermission(
        user.userId,
        "attendance:override"
      );

      if (!allowed) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      try {

        const { id, status } = req.body;

        if (!id || !status) {
          return res.status(400).json({
            error:
              "Missing id or status",
          });
        }

        await pool.query(
          `
          UPDATE leave_requests
          SET status = $1
          WHERE id = $2
          `,
          [status, id]
        );

        return res.status(200).json({
          success: true,
        });

      } catch (err: any) {

        console.error(
          "LEAVE UPDATE ERROR:",
          err
        );

        return res.status(500).json({
          error:
            err.message ||
            "Internal server error",
        });
      }
    }

    res.setHeader(
      "Allow",
      ["GET", "POST", "PUT"]
    );

    return res.status(405).json({
      error: "Method not allowed",
    });
  }
);