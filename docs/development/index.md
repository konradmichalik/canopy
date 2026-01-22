---
title: Architecture
description: Technical architecture overview of Canopy
---

# Architecture

This guide covers the architecture and technical foundation of Canopy.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Svelte 5** | UI framework with Runes for reactivity |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn-svelte** | Pre-built UI components |
| **Atlaskit Tokens** | Jira-consistent design tokens |
| **Vite** | Build tooling and dev server |
| **Tauri** | Desktop app framework |

## Application Flow

```
┌─────────────────┐
│   Connection    │
│     Screen      │
└────────┬────────┘
         │ Connect
         ▼
┌─────────────────┐
│    Dashboard    │
│  (Query List)   │
└────────┬────────┘
         │ Select Query
         ▼
┌─────────────────┐
│   Tree Screen   │
│  (Issue Tree)   │
└─────────────────┘
```

## Data Flow

```
User selects query
        │
        ▼
┌───────────────────┐
│   JiraClient      │  ──▶  Jira API
│  (Cloud/Server)   │
└────────┬──────────┘
         │ Issues[]
         ▼
┌───────────────────┐
│ Hierarchy Builder │
└────────┬──────────┘
         │ TreeNode[]
         ▼
┌───────────────────┐
│    Filters &      │
│    Grouping       │
└────────┬──────────┘
         │ Filtered/Grouped
         ▼
┌───────────────────┐
│   Tree View UI    │
└───────────────────┘
```

## Key Design Decisions

### Svelte 5 Runes

Canopy uses Svelte 5's new reactivity system with `$state`:

```typescript
// Modern Svelte 5 approach
export const issueState = $state({
  issues: [] as JiraIssue[],
  loading: false,
  error: null as string | null
});
```

### Dual Client Architecture

Separate clients for Cloud and Server handle API differences:

| Feature | Cloud | Server |
|---------|-------|--------|
| Search endpoint | `/search/jql` | `/search` |
| Pagination | `nextPageToken` | `startAt` |
| Epic Link | `parent` field | Custom field |

### localStorage Persistence

All user settings persist to localStorage for simplicity and privacy:
- No backend required
- Data stays on user's device
- Works offline after initial load

## Next Steps

- [Project Structure](/development/structure) - File organization
- [State Management](/development/state) - Svelte 5 stores
- [API Layer](/development/api) - Jira client architecture
- [Contributing](/development/contributing) - How to contribute
