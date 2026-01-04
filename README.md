# JIRA Tree Viewer

A web application for displaying JIRA tickets in a hierarchical tree structure (Epic → Story → Task).

## Features

- **Hierarchical Tree View**: Display tickets with correct parent-child relationships
- **Multiple JQL Queries**: Save and manage multiple JQL queries with titles
- **Quick Filters**: "Assigned to me" and "Unresolved" filters
- **Dark Mode**: Support for light and dark themes
- **JIRA Cloud & Server**: Support for both JIRA Cloud and Server/Data Center
- **Local Storage**: Connection settings and queries are stored in the browser
- **Import/Export**: Export and import configuration as JSON for use on different devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## CORS Proxy

Due to browser CORS restrictions, you may need to run a proxy server.

### Using the Included Proxy

```bash
cd proxy
npm install
export JIRA_BASE_URL=https://your-domain.atlassian.net
npm start
```

Then configure the app to use `http://localhost:3001/jira` as the Proxy URL.

### Connection Setup

1. Enter your JIRA URL in the **JIRA URL** field (e.g., `https://your-domain.atlassian.net`)
2. Expand **Advanced: CORS Proxy** and enter `http://localhost:3001/jira`
3. Enter your credentials

## Configuration

### JIRA Cloud

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Enter your JIRA Cloud URL (e.g., `https://your-domain.atlassian.net`)
4. Enter your email and API token

### JIRA Server/Data Center

1. Create a Personal Access Token in JIRA settings
2. Enter your JIRA Server URL
3. Enter your username and PAT (or use Basic Auth)

## Tech Stack

- **Svelte 5** with TypeScript
- **Tailwind CSS** for styling
- **Vite** as build tool
- **Lucide** for icons

## Project Structure

```
src/
├── lib/
│   ├── api/          # JIRA API clients
│   ├── components/   # Svelte components
│   ├── stores/       # State management
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
├── App.svelte        # Root component
└── main.ts           # Entry point

proxy/                # Optional CORS proxy
└── server.js
```

## Screenshots

### Dashboard
Overview and management of saved JQL queries.

### Tree View
Hierarchical display of JIRA tickets with collapsible nodes.

## License

MIT
