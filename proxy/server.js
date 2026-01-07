/**
 * CORS Proxy Server for JIRA API
 *
 * Usage:
 *   1. Install dependencies: npm install express cors node-fetch@2
 *   2. Set environment variable: export JIRA_BASE_URL=https://your-domain.atlassian.net
 *   3. Run: node server.js
 *   4. Configure app to use http://localhost:3001/jira as proxy URL
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;

if (!JIRA_BASE_URL) {
  console.error('Error: JIRA_BASE_URL environment variable is required');
  console.error('Example: export JIRA_BASE_URL=https://your-domain.atlassian.net');
  process.exit(1);
}

// Parse JSON body
app.use(express.json({ limit: '10mb' }));

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Atlassian-Token', 'X-Jira-Base-Url']
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: JIRA_BASE_URL });
});

// Info page for browser access
app.get('/jira', (req, res, next) => {
  if (req.headers.accept?.includes('application/json')) {
    return next();
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>JIRA CORS Proxy</title></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
      <h1 style="color: #0052CC;">JIRA CORS Proxy</h1>
      <p style="color: #00875A;">✓ Proxy is running</p>
      <p><strong>Target:</strong> <code>${JIRA_BASE_URL}</code></p>
      <hr>
      <p>Configure JIRA Tree to use: <code>http://localhost:${PORT}/jira</code></p>
    </body>
    </html>
  `);
});

// Proxy images (avatars, icons, etc.) with authentication
app.get('/jira-image', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  console.log(`[Proxy] IMAGE ${imageUrl}`);

  // Build headers for JIRA request
  const headers = {
    'Accept': 'image/*,*/*'
  };

  // Forward Authorization header
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  } else {
    console.log('[Proxy] WARNING: No Authorization header for image!');
  }

  try {
    const response = await fetch(imageUrl, { headers });

    if (!response.ok) {
      console.log(`[Proxy] Image error: ${response.status}`);
      return res.status(response.status).send('Image not found');
    }

    // Forward content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream the image
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[Proxy] Image fetch error:', error.message);
    res.status(500).json({ error: 'Image proxy error', message: error.message });
  }
});

// Proxy all /jira/* requests
app.all('/jira/*', async (req, res) => {
  const path = req.path.replace('/jira', '');
  const targetUrl = `${JIRA_BASE_URL}${path}`;

  console.log(`\n[Proxy] ${req.method} ${path}`);
  console.log(`[Proxy] → ${targetUrl}`);

  // Build headers for JIRA request
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Atlassian-Token': 'no-check'
  };

  // Forward Authorization header
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
    console.log('[Proxy] Auth: Basic ***');
  } else {
    console.log('[Proxy] WARNING: No Authorization header!');
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers
    };

    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log(`[Proxy] Body: ${fetchOptions.body.substring(0, 100)}...`);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();

    console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.log(`[Proxy] Error: ${responseText.substring(0, 200)}`);
    }

    // Forward response headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      // Skip headers that cause issues
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.send(responseText);
  } catch (error) {
    console.error('[Proxy] Fetch error:', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  JIRA CORS Proxy Server                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Listening on: http://localhost:${PORT}                         ║
║  Target:       ${JIRA_BASE_URL.padEnd(43)}║
║                                                              ║
║  Configure your app to use:                                  ║
║    Proxy URL: http://localhost:${PORT}/jira                     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
