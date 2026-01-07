import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Proxy for JIRA API
 *
 * The target JIRA instance is passed via X-Jira-Base-Url header,
 * allowing users to connect to any JIRA instance.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the path segments from the catch-all route
  const { path } = req.query;
  const jiraPath = Array.isArray(path) ? '/' + path.join('/') : path ? '/' + path : '';

  // Get target JIRA URL from header
  const jiraBaseUrl = req.headers['x-jira-base-url'] as string;

  if (!jiraBaseUrl) {
    return res.status(400).json({
      error: 'Missing X-Jira-Base-Url header',
      message: 'Please provide the JIRA instance URL in the X-Jira-Base-Url header'
    });
  }

  // Validate URL format
  try {
    new URL(jiraBaseUrl);
  } catch {
    return res.status(400).json({
      error: 'Invalid X-Jira-Base-Url',
      message: 'The provided URL is not valid'
    });
  }

  const targetUrl = `${jiraBaseUrl.replace(/\/$/, '')}${jiraPath}`;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, X-Atlassian-Token, X-Jira-Base-Url'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build headers for JIRA request
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Atlassian-Token': 'no-check'
  };

  // Forward Authorization header
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '') && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();

    // Forward response headers (skip problematic ones)
    const skipHeaders = ['content-encoding', 'transfer-encoding', 'connection'];
    response.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(responseText);
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
