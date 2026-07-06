import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, source, target } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const sourceLang = source || 'auto';
    const targetLang = target || 'en';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&dj=1&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.sentences && data.sentences.length > 0) {
      const translation = data.sentences.map((item: any) => item.trans).join('');
      return res.status(200).json({ 
        success: true, 
        translation,
        detectedLanguage: data.src || sourceLang
      });
    } else {
      throw new Error('No translation returned');
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Translation failed. Please try again.' 
    });
  }
}