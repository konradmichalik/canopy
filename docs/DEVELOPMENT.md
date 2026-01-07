# 🛠️ Development

This guide covers the architecture and development workflow for contributing to Canopy.

## Table of Contents

- [🏗️ Architecture Overview](#️-architecture-overview)
- [📁 Project Structure](#-project-structure)
- [🔄 State Management](#-state-management)
- [🌐 API Layer](#-api-layer)
- [🌳 Hierarchy Builder](#-hierarchy-builder)
- [🎨 Styling](#-styling)
- [✅ Code Quality](#-code-quality)

---

## 🏗️ Architecture Overview

Canopy is a Svelte 5 SPA using:

| Technology | Purpose |
|------------|---------|
| **Svelte 5** | UI framework with Runes for reactivity |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn-svelte** | Pre-built UI components |
| **Atlaskit Tokens** | Jira-consistent design tokens |
| **Vite** | Build tooling and dev server |

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── api/              # Jira API clients
│   │   ├── JiraClient.ts         # Abstract base class
│   │   ├── JiraCloudClient.ts    # Cloud implementation
│   │   ├── JiraServerClient.ts   # Server implementation
│   │   └── factory.ts            # Client factory
│   │
│   ├── components/       # Svelte components
│   │   ├── common/       # Shared UI (buttons, inputs, etc.)
│   │   ├── connection/   # Connection form
│   │   ├── filters/      # Filter dropdowns
│   │   ├── jql/          # Query management
│   │   ├── layout/       # Main layout, sidebar
│   │   ├── screens/      # Full-page screens
│   │   ├── tree/         # Tree view components
│   │   └── ui/           # shadcn-svelte components
│   │
│   ├── stores/           # State management (.svelte.ts)
│   │   ├── connection.svelte.ts
│   │   ├── issues.svelte.ts
│   │   ├── jql.svelte.ts
│   │   ├── filters.svelte.ts
│   │   ├── theme.svelte.ts
│   │   ├── colorTheme.svelte.ts
│   │   └── ...
│   │
│   ├── types/            # TypeScript types
│   │   ├── index.ts      # Core types
│   │   └── jira.ts       # Jira API types
│   │
│   └── utils/            # Utility functions
│       ├── hierarchy-builder.ts  # Tree construction
│       ├── storage.ts            # localStorage helpers
│       └── logger.ts             # Debug logging
│
├── App.svelte            # Root component
└── main.ts               # Entry point

proxy/                    # CORS proxy server
├── server.js
└── package.json

docs/                     # Documentation
└── images/               # Screenshots, logo
```

---

## 🔄 State Management

Canopy uses Svelte 5 Runes (`$state`) for reactive state management. Store files end in `.svelte.ts`.

### Core Stores

| Store | Purpose |
|-------|---------|
| `connection` | Jira URL, credentials, instance type |
| `issues` | Loaded issues, tree structure, loading state |
| `jql` | Saved queries, active query |
| `filters` | Quick filters, dynamic filters, filter states |
| `router` | Current screen (connection, dashboard, tree) |

### Preference Stores

| Store | Purpose |
|-------|---------|
| `theme` | Light/dark/system mode |
| `colorTheme` | Accent color selection |
| `displayDensity` | Comfortable/compact view |
| `fieldConfig` | Visible fields on issue cards |
| `sortConfig` | Sort field and direction |

### Store Pattern

```typescript
// Example: theme.svelte.ts
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

export const themeState = $state({
  theme: 'system' as ThemeMode
});

export function setTheme(newTheme: ThemeMode): void {
  themeState.theme = newTheme;
  setStorageItem(STORAGE_KEYS.THEME, newTheme);
  applyTheme();
}

export function initializeTheme(): void {
  const stored = getStorageItem<ThemeMode>(STORAGE_KEYS.THEME);
  if (stored) themeState.theme = stored;
  applyTheme();
}
```

### Persistence

All state is persisted to localStorage via `src/lib/utils/storage.ts`:

```typescript
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

// Read
const value = getStorageItem<MyType>(STORAGE_KEYS.MY_KEY);

// Write
setStorageItem(STORAGE_KEYS.MY_KEY, value);
```

---

## 🌐 API Layer

### Client Architecture

```
JiraClient (abstract)
├── JiraCloudClient
└── JiraServerClient
```

The factory function returns the appropriate client:

```typescript
import { createJiraClient } from './api/factory';

const client = createJiraClient({
  baseUrl: 'https://example.atlassian.net',
  instanceType: 'cloud',
  credentials: { email, apiToken }
});
```

### API Differences

| Feature | Cloud | Server |
|---------|-------|--------|
| Search endpoint | `/search/jql` | `/search` |
| Pagination | `nextPageToken` | `startAt` |
| Epic Link | `parent` field | Custom field (auto-discovered) |
| Auth | Email + API Token | Username + PAT/Password |

### Epic Link Discovery

For Server instances, the Epic Link custom field ID varies. Canopy auto-discovers it:

```typescript
// JiraServerClient.ts
async discoverEpicLinkField(): Promise<string | null> {
  const fields = await this.getFields();
  const epicLinkField = fields.find(f =>
    f.name === 'Epic Link' || f.key === 'epicLink'
  );
  return epicLinkField?.id ?? null;
}
```

---

## 🌳 Hierarchy Builder

The hierarchy builder (`src/lib/utils/hierarchy-builder.ts`) converts flat issue arrays into tree structures.

### Algorithm

1. **Index issues** by key for O(1) lookup
2. **Determine parent** for each issue (parent field → Epic Link → issue links)
3. **Build tree** by attaching children to parents
4. **Sort** by hierarchy level, then by configured field

### Key Functions

```typescript
// Build tree from flat issues
buildHierarchy(issues: JiraIssue[], epicLinkFieldId?: string): TreeNode[]

// Flatten tree for keyboard navigation
flattenTree(nodes: TreeNode[]): TreeNode[]

// Find node by key
findNode(nodes: TreeNode[], key: string): TreeNode | null

// Update node (for expand/collapse)
updateNode(nodes: TreeNode[], key: string, updates: Partial<TreeNode>): TreeNode[]
```

### TreeNode Structure

```typescript
interface TreeNode {
  issue: JiraIssue;
  children: TreeNode[];
  depth: number;
  isExpanded: boolean;
  parentKey: string | null;
}
```

---

## 🎨 Styling

### Tailwind CSS v4

Canopy uses Tailwind CSS v4 with PostCSS. Configuration is in `tailwind.config.ts`.

### Atlaskit Tokens

Design tokens from `@atlaskit/tokens` ensure Jira-consistent styling:

```css
.my-component {
  background: var(--ds-surface);
  color: var(--ds-text);
  border-color: var(--ds-border);
}
```

### shadcn-svelte

UI components are from shadcn-svelte, located in `src/lib/components/ui/`:

- Button, Input, Label
- Card, Badge
- DropdownMenu, Select
- Dialog, Tooltip
- Avatar

### Color Themes

Accent colors are applied via CSS classes:

```css
.color-theme-teal {
  --color-primary: theme('colors.teal.600');
}
```

---

## ✅ Code Quality

### Type Checking

```bash
npm run check
```

Runs `svelte-check` and TypeScript compiler.

### Linting

```bash
# Check
npm run lint

# Auto-fix
npm run lint:fix
```

ESLint with Svelte and TypeScript plugins.

### Formatting

```bash
# Check
npm run format:check

# Auto-format
npm run format
```

Prettier with Svelte plugin.

### Pre-commit Checklist

Before committing:

```bash
npm run check && npm run lint && npm run format:check
```

---

## ➕ Adding Features

### New Store

1. Create `src/lib/stores/myFeature.svelte.ts`
2. Define state with `$state({})`
3. Add storage key to `src/lib/utils/storage.ts`
4. Export initialization function
5. Call initializer in `App.svelte`

### New Filter Type

1. Add filter type to `src/lib/types/index.ts`
2. Update `buildDynamicFilters()` in `filters.svelte.ts`
3. Add UI component in `src/lib/components/filters/`

### New API Field

1. Add type to `src/lib/types/jira.ts`
2. Update field expansion in `JiraClient.ts`
3. Add to `fieldConfig` store if user-configurable
