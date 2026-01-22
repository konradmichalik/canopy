---
title: Project Structure
description: File and folder organization in Canopy
---

# Project Structure

Overview of the codebase organization.

## Root Directory

```
canopy/
├── src/                  # Application source code
├── src-tauri/            # Tauri desktop app (Rust)
├── proxy/                # CORS proxy server
├── docs/                 # Documentation (VitePress)
├── public/               # Static assets
├── package.json          # Node.js dependencies
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Source Code (`src/`)

```
src/
├── lib/
│   ├── api/              # Jira API clients
│   ├── components/       # Svelte components
│   ├── stores/           # State management
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│
├── App.svelte            # Root component
└── main.ts               # Entry point
```

## API Layer (`src/lib/api/`)

```
api/
├── JiraClient.ts         # Abstract base class
├── JiraCloudClient.ts    # Jira Cloud implementation
├── JiraServerClient.ts   # Jira Server implementation
└── factory.ts            # Client factory function
```

## Components (`src/lib/components/`)

```
components/
├── ui/                   # shadcn-svelte base components
│   ├── button/
│   ├── input/
│   ├── dialog/
│   └── ...
│
├── tree/                 # Tree view components
│   ├── TreeView.svelte
│   ├── TreeNode.svelte
│   └── IssueCard.svelte
│
├── filters/              # Filter components
│   ├── QuickFilters.svelte
│   ├── DynamicFilters.svelte
│   └── FilterBar.svelte
│
├── jql/                  # Query management
│   ├── QueryList.svelte
│   └── QueryEditor.svelte
│
├── connection/           # Connection form
│   └── ConnectionForm.svelte
│
├── layout/               # Layout components
│   ├── Header.svelte
│   └── Sidebar.svelte
│
└── screens/              # Full-page screens
    ├── ConnectionScreen.svelte
    ├── DashboardScreen.svelte
    └── TreeScreen.svelte
```

## Stores (`src/lib/stores/`)

Store files use `.svelte.ts` extension for Svelte 5 runes:

```
stores/
├── connection.svelte.ts    # Jira connection state
├── issues.svelte.ts        # Loaded issues and tree
├── jql.svelte.ts           # Saved queries
├── filters.svelte.ts       # Filter states
├── router.svelte.ts        # Screen navigation
├── theme.svelte.ts         # Light/dark mode
├── colorTheme.svelte.ts    # Accent color
├── displayDensity.svelte.ts
├── fieldConfig.svelte.ts
├── sortConfig.svelte.ts
├── grouping.svelte.ts
├── changeTracking.svelte.ts
├── autoRefresh.svelte.ts
└── keyboardNavigation.svelte.ts
```

## Types (`src/lib/types/`)

```
types/
├── index.ts              # Core app types (TreeNode, filters, UI)
└── jira.ts               # Jira API response types
```

## Utilities (`src/lib/utils/`)

```
utils/
├── hierarchy-builder.ts  # Tree construction algorithm
├── storage.ts            # localStorage helpers
├── logger.ts             # Debug logging
└── date.ts               # Date formatting
```

## Desktop App (`src-tauri/`)

```
src-tauri/
├── src/
│   └── lib.rs            # Rust entry point
├── capabilities/         # Permission definitions
├── icons/                # App icons
├── tauri.conf.json       # Tauri configuration
└── Cargo.toml            # Rust dependencies
```

## Documentation (`docs/`)

```
docs/
├── .vitepress/
│   └── config.ts         # VitePress configuration
├── getting-started/      # Getting started guides
├── guide/                # Feature documentation
├── desktop/              # Desktop app docs
├── reference/            # Reference material
├── development/          # Developer docs
├── images/               # Screenshots and logo
├── public/               # Static assets
└── index.md              # Landing page
```
