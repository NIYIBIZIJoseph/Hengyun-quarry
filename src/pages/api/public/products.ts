import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

// Define the Product type
interface Product {
  id: number;
  name: string;
  category_name: string;
  price: number;
  stock_quantity: number;
  reorder_level: number;
  image_url: string | null;
}

// Define cache with proper type
let cachedProducts: Product[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION: number = 60 * 1000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return cached data if still fresh
  if (cachedProducts && (Date.now() - cacheTime) < CACHE_DURATION) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(cachedProducts);
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        category_name, 
        price, 
        stock_quantity, 
        reorder_level, 
        image_url 
      FROM products 
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY name ASC
    `);
    
    cachedProducts = result.rows as Product[];
    cacheTime = Date.now();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(cachedProducts);
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}