import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from "@/lib/middleware/withAuth";

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  return res.status(200).json({
    valid: true,
    user,
  });
});