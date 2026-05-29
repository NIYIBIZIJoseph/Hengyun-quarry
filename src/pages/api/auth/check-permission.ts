import type { NextApiRequest, NextApiResponse } from 'next';

import { withAuth } from '@/lib/middleware/withAuth';
import { hasPermission } from '@/lib/permissions';

export default withAuth(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    user
  ) => {

    // =========================================
    // METHOD VALIDATION
    // =========================================
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }

    // =========================================
    // VALIDATE PERMISSION QUERY
    // =========================================
    const { permission } = req.query;

    if (
      !permission ||
      typeof permission !== 'string'
    ) {
      return res.status(400).json({
        error: 'Permission required',
      });
    }

    // =========================================
    // CHECK PERMISSION
    // =========================================
    const allowed = await hasPermission(
      user.userId,
      permission
    );

    return res.status(200).json({
      hasPermission: allowed,
    });
  }
);