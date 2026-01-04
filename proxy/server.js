/**
 * CORS Proxy Server for JIRA API
 *
 * Usage:
 *   1. Install dependencies: npm install express http-proxy-middleware cors
 *   2. Set environment variable: export JIRA_BASE_URL=https://your-domain.atlassian.net
 *   3. Run: node server.js
 *   4. Configure app to use http://localhost:3001/jira as proxy URL
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3001;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;

if (!JIRA_BASE_URL) {
  console.error('Error: JIRA_BASE_URL environment variable is required');
  console.error('Example: export JIRA_BASE_URL=https://your-domain.atlassian.net');
  process.exit(1);
}

// Enable CORS for all origins
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: JIRA_BASE_URL });
});

// Info page for direct browser access to /jira root
app.get('/jira', (req, res, next) => {
  // If it's an API request (has Accept: application/json), proxy it
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('application/json')) {
    return next();
  }

  // Otherwise show info page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JIRA CORS Proxy</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        h1 { color: #0052CC; }
        code { background: #f4f5f7; padding: 2px 6px; border-radius: 3px; }
        .status { color: #00875A; }
      </style>
    </head>
    <body>
      <h1>JIRA CORS Proxy</h1>
      <p class="status">✓ Proxy is running</p>
      <p><strong>Target:</strong> <code>${JIRA_BASE_URL}</code></p>
      <hr>
      <p>This proxy is designed for API requests from the JIRA Tree app, not for direct browser access.</p>
      <p><strong>Usage in JIRA Tree:</strong></p>
      <ol>
        <li>Open JIRA Tree app</li>
        <li>In connection settings, set Proxy URL to: <code>http://localhost:${PORT}/jira</code></li>
        <li>Enter your JIRA credentials</li>
      </ol>
      <p><strong>Test API:</strong> <a href="/jira/rest/api/3/myself">/jira/rest/api/3/myself</a> (requires auth)</p>
    </body>
    </html>
  `);
});

// Proxy middleware
const jiraProxy = createProxyMiddleware({
  target: JIRA_BASE_URL,
  changeOrigin: true,
  followRedirects: false, // Don't follow redirects - let client handle them
  pathRewrite: {
    '^/jira': '' // Remove /jira prefix
  },
  onProxyReq: (proxyReq, req) => {
    // Forward authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Forward Atlassian token header (bypasses XSRF check)
    if (req.headers['x-atlassian-token']) {
      proxyReq.setHeader('X-Atlassian-Token', req.headers['x-atlassian-token']);
    }

    // Log request (optional)
    console.log(`[Proxy] ${req.method} ${req.path} -> ${JIRA_BASE_URL}${req.path.replace('/jira', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log response status
    console.log(`[Proxy] Response: ${proxyRes.statusCode}`);

    // Rewrite redirect Location headers to go through proxy
    if (proxyRes.headers.location) {
      const location = proxyRes.headers.location;
      // If redirect points to JIRA, rewrite to go through proxy
      if (location.startsWith(JIRA_BASE_URL)) {
        const newLocation = location.replace(JIRA_BASE_URL, `http://localhost:${PORT}/jira`);
        proxyRes.headers.location = newLocation;
        console.log(`[Proxy] Rewrote redirect: ${location} -> ${newLocation}`);
      } else if (location.startsWith('/')) {
        // Relative redirect - prefix with proxy path
        const newLocation = `/jira${location}`;
        proxyRes.headers.location = newLocation;
        console.log(`[Proxy] Rewrote relative redirect: ${location} -> ${newLocation}`);
      }
    }
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply proxy to /jira path
app.use('/jira', jiraProxy);

// Start server
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
