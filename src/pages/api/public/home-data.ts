import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run ALL queries in PARALLEL for maximum speed
    const [productsResult, teamResult, faqResult] = await Promise.all([
      // Products for Market page
      pool.query(`
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
        LIMIT 50
      `),
      
      // Team members for About page
      pool.query(`
        SELECT 
          id, 
          name, 
          role, 
          bio, 
          image_url 
        FROM team_members 
        WHERE is_active = true
        ORDER BY sort_order ASC
        LIMIT 20
      `),
      
      // FAQs for FAQ page
      pool.query(`
        SELECT 
          id, 
          question, 
          answer, 
          category 
        FROM faq_items 
        WHERE is_active = true
        ORDER BY sort_order ASC
        LIMIT 30
      `)
    ]);

    // Add cache headers for Vercel CDN
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      products: productsResult.rows,
      team: teamResult.rows,
      faqs: faqResult.rows,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Home data API error:', error);
    
    // Return fallback data on error (don't break the site)
    return res.status(200).json({
      success: false,
      products: [],
      team: [
        { id: 1, name: "Zhang Wei", role: "Founder & CEO", bio: "20+ years in quarry industry", image_url: null },
        { id: 2, name: "Wang Li", role: "Operations Manager", bio: "Expert in logistics", image_url: null },
      ],
      faqs: [
        { id: 1, question: "What products do you offer?", answer: "We offer sand and quarry products", category: "products" },
      ],
      lastUpdated: new Date().toISOString()
    });
  }
}