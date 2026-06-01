import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      client_name, 
      client_phone, 
      delivery_location, 
      items, 
      notes,
      bargaining 
    } = req.body;

    // Validate required fields
    if (!client_name) {
      return res.status(400).json({ error: "Client name is required" });
    }
    if (!client_phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "At least one product is required" });
    }
    if (!delivery_location) {
      return res.status(400).json({ error: "Delivery location is required" });
    }

    // Generate order number
    const orderNumber = "PUB-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Calculate total amount from items
      let totalAmount = 0;
      for (const item of items) {
        const productRes = await client.query(
          "SELECT price FROM products WHERE id = $1 AND deleted_at IS NULL",
          [item.product_id]
        );
        if (productRes.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        const unitPrice = parseFloat(productRes.rows[0].price);
        totalAmount += unitPrice * item.quantity;
      }

      // Combine notes and bargaining info
      const combinedNotes = [];
      if (notes) combinedNotes.push(`Notes: ${notes}`);
      if (bargaining) combinedNotes.push(`Bargaining: ${bargaining}`);
      const finalNotes = combinedNotes.join(' | ') || null;

      // Insert order - USING CORRECT COLUMN NAMES from your table
      const orderResult = await client.query(
        `
        INSERT INTO orders (
          order_number, 
          client_name, 
          client_phone, 
          status, 
          delivery_location,
          notes,
          total_amount,
          payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
          orderNumber,           // order_number
          client_name,           // client_name
          client_phone,          // client_phone
          'pending',             // status
          delivery_location,     // delivery_location
          finalNotes,            // notes (plural, not note)
          totalAmount,           // total_amount
          'unpaid'               // payment_status
        ]
      );

      const order = orderResult.rows[0];

      // Insert order items
      for (const item of items) {
        const productRes = await client.query(
          "SELECT price FROM products WHERE id = $1 AND deleted_at IS NULL",
          [item.product_id]
        );
        const unitPrice = parseFloat(productRes.rows[0].price);
        const subtotal = unitPrice * item.quantity;

        await client.query(
          `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [order.id, item.product_id, item.quantity, unitPrice, subtotal]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({ 
        success: true, 
        message: "Order submitted successfully! We will contact you shortly.",
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Public order error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to submit order. Please try again." 
    });
  }
}