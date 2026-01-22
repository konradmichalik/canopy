---
title: State Management
description: Svelte 5 stores and state management patterns
---

# State Management

Canopy uses Svelte 5 Runes (`$state`) for reactive state management.

## Store Pattern

All stores follow a consistent pattern:

```typescript
// example.svelte.ts
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

// 1. Define state with $state
export const exampleState = $state({
  value: 'default',
  loading: false
});

// 2. Define actions
export function setValue(newValue: string): void {
  exampleState.value = newValue;
  setStorageItem(STORAGE_KEYS.EXAMPLE, newValue);
}

// 3. Initialize from storage
export function initializeExample(): void {
  const stored = getStorageItem<string>(STORAGE_KEYS.EXAMPLE);
  if (stored) {
    exampleState.value = stored;
  }
}
```

## Core Stores

### Connection Store

Manages Jira connection credentials:

```typescript
export const connectionState = $state({
  baseUrl: '',
  instanceType: 'cloud' as InstanceType,
  credentials: null as Credentials | null,
  isConnected: false
});
```

### Issues Store

Manages loaded issues and tree structure:

```typescript
export const issueState = $state({
  issues: [] as JiraIssue[],
  tree: [] as TreeNode[],
  loading: false,
  error: null as string | null
});
```

### JQL Store

Manages saved queries:

```typescript
export const jqlState = $state({
  queries: [] as SavedQuery[],
  activeQueryId: null as string | null
});
```

### Filters Store

Manages filter states:

```typescript
export const filterState = $state({
  quickFilters: [] as QuickFilter[],
  dynamicFilters: {} as Record<string, string[]>,
  searchText: '',
  savedFilters: [] as SavedFilter[]
});
```

## Preference Stores

Simple stores for user preferences:

```typescript
// theme.svelte.ts
export const themeState = $state({
  theme: 'system' as ThemeMode
});

// colorTheme.svelte.ts
export const colorThemeState = $state({
  color: 'blue' as ColorTheme
});

// displayDensity.svelte.ts
export const densityState = $state({
  density: 'comfortable' as Density
});
```

## Persistence

All state is persisted to localStorage:

```typescript
// storage.ts
export const STORAGE_KEYS = {
  CONNECTION: 'canopy_connection',
  JQL_QUERIES: 'canopy_jql_queries',
  FILTERS: 'canopy_filters',
  THEME: 'canopy_theme',
  COLOR_THEME: 'canopy_color_theme',
  // ... more keys
};

export function getStorageItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

export function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
```

## Initialization

Stores are initialized in `App.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeTheme } from './lib/stores/theme.svelte';
  import { initializeConnection } from './lib/stores/connection.svelte';
  // ... more imports

  onMount(() => {
    initializeTheme();
    initializeConnection();
    initializeJql();
    initializeFilters();
    // ... more initializations
  });
</script>
```

## Reactive Derivations

Use `$derived` for computed values:

```typescript
// In component
const filteredIssues = $derived(
  issueState.issues.filter(issue =>
    matchesFilters(issue, filterState)
  )
);
```

## Store Communication

Stores communicate via function calls:

```typescript
// When query changes, reload issues
export async function selectQuery(queryId: string): Promise<void> {
  jqlState.activeQueryId = queryId;

  // Trigger issue reload
  const query = jqlState.queries.find(q => q.id === queryId);
  if (query) {
    await loadIssues(query.jql);
  }
}
```
