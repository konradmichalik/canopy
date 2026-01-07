import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Proxy for JIRA Images (avatars, icons, etc.)
 *
 * Required query parameter: url (the image URL to fetch)
 * Authorization header is forwarded to authenticate with JIRA.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    return res.status(400).json({
      error: 'Missing url parameter',
      message: 'Please provide the image URL as a query parameter'
    });
  }

  // Validate URL format
  try {
    new URL(imageUrl);
  } catch {
    return res.status(400).json({
      error: 'Invalid URL',
      message: 'The provided URL is not valid'
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build headers for JIRA request
  const headers: HeadersInit = {
    Accept: 'image/*,*/*'
  };

  // Forward Authorization header
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const response = await fetch(imageUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).send('Image not found');
    }

    // Forward content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send the image
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    res.status(500).json({
      error: 'Image proxy error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
