import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

import { requireAuth } from '@/lib/middleware/requireAuth';
import { ROLES } from '@/lib/roles';

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  if (user.role !== ROLES.SUPERADMIN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT role_name, modules FROM role_dashboard_config'
    );

    const config: Record<string, string[]> = {};

    result.rows.forEach(row => {
      config[row.role_name] = row.modules;
    });

    return res.status(200).json({ config });
  }

  if (req.method === 'PUT') {
    const { config } = req.body;

    for (const [roleName, modules] of Object.entries(config)) {
      await pool.query(
        `
        INSERT INTO role_dashboard_config (role_name, modules)
        VALUES ($1, $2)
        ON CONFLICT (role_name)
        DO UPDATE SET modules = EXCLUDED.modules
        `,
        [roleName, modules]
      );
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
});