import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    keepExtensions: true,
    multiples: false,
    maxFileSize: 3 * 1024 * 1024, // 3 MB
  });

  try {
    const data: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    let file: any = data.files.image;
    if (Array.isArray(file)) file = file[0];

    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // ✅ Convert to base64 data URL — no disk writes
    const buffer = fs.readFileSync(file.filepath);
    const ext = (file.originalFilename?.split('.').pop() || 'jpg').toLowerCase();
    const mime =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'gif' ? 'image/gif' :
      'image/jpeg';

    const base64 = `data:${mime};base64,${buffer.toString('base64')}`;

    // Clean up the temp file
    try { fs.unlinkSync(file.filepath); } catch {}

    return res.status(200).json({ url: base64 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}