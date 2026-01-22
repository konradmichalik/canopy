---
title: Installation
description: How to install and run Canopy locally
---

# Installation

This guide covers how to install and run Canopy locally.

## Requirements

- Node.js 18 or higher
- npm or yarn
- A Jira Cloud or Server/Data Center instance

## Web Application

### Development Setup

```bash
# Clone the repository
git clone https://github.com/konradmichalik/canopy.git
cd canopy

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The production build outputs to the `dist/` directory and can be deployed to any static hosting service.

## CORS Proxy

Due to browser CORS restrictions, Jira API calls from the browser are blocked. A proxy server is required for local development.

### Using the Included Proxy

A simple Express-based proxy is included in the `proxy/` directory:

```bash
cd proxy
npm install
```

Set your Jira base URL as an environment variable:

```bash
# For Jira Cloud
export JIRA_BASE_URL=https://your-domain.atlassian.net

# For Jira Server
export JIRA_BASE_URL=https://jira.your-company.com
```

Start the proxy:

```bash
npm start
```

The proxy runs on `http://localhost:3001`.

### Connection Setup

1. Open Canopy in your browser (`http://localhost:5173`)
2. Enter your Jira URL in the **Jira URL** field
3. Expand **Advanced: CORS Proxy**
4. Enter `http://localhost:3001/jira` as the proxy URL
5. Enter your credentials (see [Configuration](/guide/configuration))

### Alternative: Browser Extension

You can also use a browser extension to bypass CORS:

- **Chrome**: [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
- **Firefox**: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

::: warning
Only enable CORS extensions while using Canopy. Leaving them enabled can pose security risks.
:::

### Production Deployment

For production, configure your web server (nginx, Apache) to proxy `/api/*` requests to your Jira instance, or deploy behind a corporate proxy that handles authentication.

## Desktop App

The desktop app connects directly to Jira without requiring a CORS proxy. See the [Desktop Installation](/desktop/installation) guide for setup instructions.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Run svelte-check and TypeScript compiler |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format:check` | Check Prettier formatting |
| `npm run format` | Auto-format with Prettier |
