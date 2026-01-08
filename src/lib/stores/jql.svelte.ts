/**
 * JQL Queries Store
 * Manages saved queries and separators with Svelte 5 Runes
 */

import type {
  SavedQuery,
  QueryColor,
  SortConfig,
  GroupByOption,
  QueryListItem,
  QuerySeparator
} from '../types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { generateQueryId, generateSeparatorId, isQuery, isSeparator } from '../types/tree';
import { logger } from '../utils/logger';
import { generateSlug, slugsMatch } from '../utils/slug';

// State container object - now stores both queries and separators
export const jqlState = $state({
  items: [] as QueryListItem[]
});

/**
 * Initialize items from storage (with migration for old format)
 */
export function initializeQueries(): void {
  const stored = getStorageItem<QueryListItem[]>(STORAGE_KEYS.QUERIES);

  if (stored && Array.isArray(stored)) {
    // Migrate old format: items without 'type' field get type: 'query'
    jqlState.items = stored.map((item) => {
      if (!item.type) {
        return { ...item, type: 'query' as const };
      }
      return item;
    });
    logger.store('jql', 'Loaded items from storage', { count: jqlState.items.length });
  } else {
    jqlState.items = [];
    logger.store('jql', 'No stored items found');
  }
}

/**
 * Get all items (queries and separators)
 */
export function getAllItems(): QueryListItem[] {
  return jqlState.items;
}

/**
 * Get only queries (filter out separators)
 */
export function getQueries(): SavedQuery[] {
  return jqlState.items.filter(isQuery) as SavedQuery[];
}

/**
 * Get a query by ID
 */
export function getQueryById(id: string): SavedQuery | undefined {
  const queries = getQueries();
  return queries.find((q) => q.id === id);
}

/**
 * Get a query by slug (URL-friendly title)
 */
export function getQueryBySlug(slug: string): SavedQuery | undefined {
  const queries = getQueries();
  return queries.find((q) => generateSlug(q.title) === slug);
}

/**
 * Get slug for a query
 */
export function getQuerySlug(query: SavedQuery): string {
  return generateSlug(query.title);
}

/**
 * Check if a title is unique (considering slug collisions)
 * @param title - The title to check
 * @param excludeId - Optional query ID to exclude (for edits)
 * @returns true if title is unique, false if it would create a slug collision
 */
export function isTitleUnique(title: string, excludeId?: string): boolean {
  const queries = getQueries();
  return !queries.some((q) => q.id !== excludeId && slugsMatch(q.title, title));
}

/**
 * Add a new query
 */
export function addQuery(title: string, jql: string, color?: QueryColor): SavedQuery {
  const now = new Date().toISOString();
  const newQuery: SavedQuery = {
    type: 'query',
    id: generateQueryId(),
    title: title.trim(),
    jql: jql.trim(),
    color,
    createdAt: now,
    updatedAt: now
  };

  jqlState.items = [...jqlState.items, newQuery];
  persistItems();
  logger.store('jql', 'Added query', { id: newQuery.id, title: newQuery.title, color });

  return newQuery;
}

/**
 * Update an existing query
 */
export function updateQuery(
  id: string,
  updates: Partial<
    Pick<
      SavedQuery,
      | 'title'
      | 'jql'
      | 'color'
      | 'displayFields'
      | 'activeFilterIds'
      | 'searchText'
      | 'sortConfig'
      | 'groupBy'
      | 'showEntryNode'
      | 'optionsExpanded'
      | 'cachedIssueCount'
    >
  >
): boolean {
  const index = jqlState.items.findIndex((item) => isQuery(item) && item.id === id);

  if (index === -1) {
    logger.warn(`Query ${id} not found for update`);
    return false;
  }

  const updated: SavedQuery = {
    ...(jqlState.items[index] as SavedQuery),
    ...updates,
    updatedAt: new Date().toISOString()
  };

  jqlState.items = [...jqlState.items.slice(0, index), updated, ...jqlState.items.slice(index + 1)];
  persistItems();
  logger.store('jql', 'Updated query', { id, updates });

  return true;
}

/**
 * Update display fields for a query
 */
export function updateQueryDisplayFields(id: string, displayFields: string[]): boolean {
  return updateQuery(id, { displayFields });
}

/**
 * Update active filter IDs for a query
 */
export function updateQueryActiveFilters(id: string, activeFilterIds: string[]): boolean {
  return updateQuery(id, { activeFilterIds });
}

/**
 * Update search text for a query
 */
export function updateQuerySearchText(id: string, searchText: string): boolean {
  return updateQuery(id, { searchText: searchText || undefined });
}

/**
 * Update sort configuration for a query
 */
export function updateQuerySortConfig(id: string, sortConfig: SortConfig): boolean {
  return updateQuery(id, { sortConfig });
}

/**
 * Update grouping configuration for a query
 */
export function updateQueryGroupBy(id: string, groupBy: GroupByOption): boolean {
  return updateQuery(id, { groupBy });
}

/**
 * Update options panel expanded state for a query
 */
export function updateQueryOptionsExpanded(id: string, optionsExpanded: boolean): boolean {
  return updateQuery(id, { optionsExpanded });
}

/**
 * Update cached issue count for a query
 */
export function updateQueryIssueCount(id: string, cachedIssueCount: number): boolean {
  return updateQuery(id, { cachedIssueCount });
}

/**
 * Duplicate a query
 */
export function duplicateQuery(id: string): SavedQuery | null {
  const original = getQueryById(id);
  if (!original) {
    logger.warn(`Query ${id} not found for duplication`);
    return null;
  }

  // Generate unique title
  let copyTitle = `${original.title} (Copy)`;
  let copyNumber = 1;
  while (!isTitleUnique(copyTitle)) {
    copyNumber++;
    copyTitle = `${original.title} (Copy ${copyNumber})`;
  }

  const now = new Date().toISOString();
  const duplicatedQuery: SavedQuery = {
    ...original,
    id: generateQueryId(),
    title: copyTitle,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    cachedIssueCount: undefined
  };

  addImportedQuery(duplicatedQuery);
  return duplicatedQuery;
}

/**
 * Delete a query
 */
export function deleteQuery(id: string): boolean {
  const index = jqlState.items.findIndex((item) => isQuery(item) && item.id === id);

  if (index === -1) {
    logger.warn(`Query ${id} not found for deletion`);
    return false;
  }

  jqlState.items = [...jqlState.items.slice(0, index), ...jqlState.items.slice(index + 1)];
  persistItems();
  logger.store('jql', 'Deleted query', { id });

  return true;
}

/**
 * Reorder items (queries and separators)
 */
export function reorderItems(fromIndex: number, toIndex: number): void {
  if (fromIndex < 0 || fromIndex >= jqlState.items.length) return;
  if (toIndex < 0 || toIndex >= jqlState.items.length) return;

  const newItems = [...jqlState.items];
  const [removed] = newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, removed);

  jqlState.items = newItems;
  persistItems();
}

/**
 * Set default query
 */
export function setDefaultQuery(id: string): void {
  jqlState.items = jqlState.items.map((item) => {
    if (isQuery(item)) {
      return { ...item, isDefault: item.id === id };
    }
    return item;
  });
  persistItems();
}

/**
 * Get default query
 */
export function getDefaultQuery(): SavedQuery | undefined {
  const queries = getQueries();
  return queries.find((q) => q.isDefault) || queries[0];
}

/**
 * Add an already-constructed query (e.g., from import)
 */
export function addImportedQuery(query: SavedQuery): void {
  const queryWithType: SavedQuery = { ...query, type: 'query' };
  jqlState.items = [...jqlState.items, queryWithType];
  persistItems();
  logger.store('jql', 'Added imported query', { id: query.id, title: query.title });
}

/**
 * Import queries from JSON
 */
export function importQueries(data: SavedQuery[]): number {
  const now = new Date().toISOString();
  let imported = 0;

  data.forEach((q) => {
    const newQuery: SavedQuery = {
      ...q,
      type: 'query',
      id: generateQueryId(),
      createdAt: q.createdAt || now,
      updatedAt: now
    };
    jqlState.items = [...jqlState.items, newQuery];
    imported++;
  });

  persistItems();
  logger.store('jql', 'Imported queries', { count: imported });

  return imported;
}

/**
 * Export queries as JSON (only queries, not separators)
 */
export function exportQueries(): string {
  return JSON.stringify(getQueries(), null, 2);
}

// ============================================
// Separator Management
// ============================================

/**
 * Add a new separator
 */
export function addSeparator(title?: string): QuerySeparator {
  const now = new Date().toISOString();
  const newSeparator: QuerySeparator = {
    type: 'separator',
    id: generateSeparatorId(),
    title: title?.trim() || undefined,
    createdAt: now,
    updatedAt: now
  };

  jqlState.items = [...jqlState.items, newSeparator];
  persistItems();
  logger.store('jql', 'Added separator', { id: newSeparator.id, title: newSeparator.title });

  return newSeparator;
}

/**
 * Update a separator
 */
export function updateSeparator(id: string, title?: string): boolean {
  const index = jqlState.items.findIndex((item) => isSeparator(item) && item.id === id);

  if (index === -1) {
    logger.warn(`Separator ${id} not found for update`);
    return false;
  }

  const updated: QuerySeparator = {
    ...(jqlState.items[index] as QuerySeparator),
    title: title?.trim() || undefined,
    updatedAt: new Date().toISOString()
  };

  jqlState.items = [...jqlState.items.slice(0, index), updated, ...jqlState.items.slice(index + 1)];
  persistItems();
  logger.store('jql', 'Updated separator', { id, title });

  return true;
}

/**
 * Delete a separator
 */
export function deleteSeparator(id: string): boolean {
  const index = jqlState.items.findIndex((item) => isSeparator(item) && item.id === id);

  if (index === -1) {
    logger.warn(`Separator ${id} not found for deletion`);
    return false;
  }

  jqlState.items = [...jqlState.items.slice(0, index), ...jqlState.items.slice(index + 1)];
  persistItems();
  logger.store('jql', 'Deleted separator', { id });

  return true;
}

/**
 * Persist items to storage
 */
function persistItems(): void {
  setStorageItem(STORAGE_KEYS.QUERIES, jqlState.items);
}
