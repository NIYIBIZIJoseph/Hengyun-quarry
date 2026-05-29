import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { withAuth } from "@/lib/middleware/withAuth";
import { hasPermission } from "@/lib/permissions";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allowed = await hasPermission(user.userId, "product:view");
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const { format } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        p.name,
        c.name AS category,
        p.stock_quantity,
        p.reorder_level,
        p.price,
        p.is_active
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.name ASC
    `);

    const products = result.rows;

    // ================= CSV =================
    if (format === "csv") {
      let csv = "Name,Category,Stock,Reorder Level,Price,Active\n";

      for (const p of products) {
        const row = [
          p.name,
          p.category || "",
          p.stock_quantity,
          p.reorder_level,
          p.price,
          p.is_active ? "Yes" : "No"
        ].join(",");

        csv += row + "\n";
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
      return res.status(200).send(csv);
    }

    // ================= HTML =================
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h2>Inventory Report</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Price</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const p of products) {
      html += `
        <tr>
          <td>${p.name}</td>
          <td>${p.category || ""}</td>
          <td>${p.stock_quantity}</td>
          <td>${p.reorder_level}</td>
          <td>${p.price}</td>
          <td>${p.is_active ? "Yes" : "No"}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "attachment; filename=inventory.html");
    return res.status(200).send(html);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Export failed" });
  }
});