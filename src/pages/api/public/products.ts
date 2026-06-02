import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First, let's just get products without category join to see if data exists
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        price, 
        stock_quantity, 
        reorder_level, 
        image_url,
        category_id
      FROM products 
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY name ASC
    `);
    
    console.log('Products found:', result.rows.length);
    
    // If no products, return empty array
    if (result.rows.length === 0) {
      return res.status(200).json([]);
    }
    
    // Map products to include category_name (default to 'general' if no category)
    const products = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      category_name: product.category_id === 1 ? 'sand' : product.category_id === 2 ? 'quarry' : 'general',
      price: parseFloat(product.price),
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      image_url: product.image_url
    }));
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(products);
    
  } catch (error) {
    console.error('Products API error:', error);
    // Return empty array on error (don't return 500 to frontend)
    return res.status(200).json([]);
  }
}