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
  QuerySeparator,
  CustomFilter,
  CustomFilterIcon
} from '../types';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { generateQueryId, generateSeparatorId, isQuery, isSeparator } from '../types/tree';
import { logger } from '../utils/logger';
import { generateSlug, slugsMatch } from '../utils/slug';
import { clearCheckpoint } from './changeTracking.svelte';

// State container object - now stores both queries and separators
export const jqlState = $state({
  items: [] as QueryListItem[]
});

/**
 * Initialize items from storage (with migration for old format)
 */
export async function initializeQueries(): Promise<void> {
  const stored = await getStorageItemAsync<QueryListItem[]>(STORAGE_KEYS.QUERIES);

  if (stored && Array.isArray(stored)) {
    // Migrate old format: items without 'type' field get type: 'query'
    const migrated = stored.map((item) => {
      if (!item.type) {
        return { ...item, type: 'query' as const };
      }
      return item;
    });

    // Deduplicate by ID (keep first occurrence)
    const seen = new Set<string>();
    const deduplicated = migrated.filter((item) => {
      if (seen.has(item.id)) {
        logger.warn(`Duplicate item ID found and removed: ${item.id}`);
        return false;
      }
      seen.add(item.id);
      return true;
    });

    jqlState.items = deduplicated;

    // Persist if we removed duplicates
    if (deduplicated.length !== stored.length) {
      persistItems();
      logger.store('jql', 'Removed duplicate items', {
        original: stored.length,
        deduplicated: deduplicated.length
      });
    }

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
      | 'customFilters'
      | 'activeCustomFilterId'
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

  // Clean up any stored checkpoint for this query
  clearCheckpoint(id);

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

// ============================================
// Custom Filter Management (per-query)
// ============================================

/**
 * Generate a unique ID for a custom filter
 */
function generateCustomFilterId(): string {
  return `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a custom filter to a query
 */
export function addQueryCustomFilter(
  queryId: string,
  name: string,
  filterIds: string[],
  recencyFilter: import('../types').RecencyFilterOption,
  searchText: string,
  icon?: CustomFilterIcon
): CustomFilter | null {
  const query = getQueryById(queryId);
  if (!query) {
    logger.warn(`Query ${queryId} not found for adding custom filter`);
    return null;
  }

  const customFilter: CustomFilter = {
    id: generateCustomFilterId(),
    name: name.trim(),
    icon,
    filterIds,
    recencyFilter,
    searchText,
    createdAt: new Date().toISOString()
  };

  const customFilters = [...(query.customFilters || []), customFilter];
  updateQuery(queryId, { customFilters });

  logger.store('jql', 'Added custom filter to query', { queryId, filterId: customFilter.id, name });
  return customFilter;
}

/**
 * Update a custom filter in a query
 */
export function updateQueryCustomFilter(
  queryId: string,
  filterId: string,
  name: string,
  icon?: CustomFilterIcon
): boolean {
  const query = getQueryById(queryId);
  if (!query || !query.customFilters) {
    logger.warn(`Query ${queryId} or custom filters not found`);
    return false;
  }

  const customFilters = query.customFilters.map((f) =>
    f.id === filterId ? { ...f, name: name.trim(), icon } : f
  );
  updateQuery(queryId, { customFilters });

  logger.store('jql', 'Updated custom filter', { queryId, filterId, name });
  return true;
}

/**
 * Delete a custom filter from a query
 */
export function deleteQueryCustomFilter(queryId: string, filterId: string): boolean {
  const query = getQueryById(queryId);
  if (!query || !query.customFilters) {
    logger.warn(`Query ${queryId} or custom filters not found`);
    return false;
  }

  const customFilters = query.customFilters.filter((f) => f.id !== filterId);
  const activeCustomFilterId =
    query.activeCustomFilterId === filterId ? null : query.activeCustomFilterId;
  updateQuery(queryId, { customFilters, activeCustomFilterId });

  logger.store('jql', 'Deleted custom filter', { queryId, filterId });
  return true;
}

/**
 * Set active custom filter for a query
 */
export function setQueryActiveCustomFilter(queryId: string, filterId: string | null): boolean {
  return updateQuery(queryId, { activeCustomFilterId: filterId });
}

/**
 * Reorder custom filters within a query
 */
export function reorderQueryCustomFilters(
  queryId: string,
  fromIndex: number,
  toIndex: number
): boolean {
  const query = getQueryById(queryId);
  if (!query || !query.customFilters) return false;
  if (fromIndex < 0 || fromIndex >= query.customFilters.length) return false;
  if (toIndex < 0 || toIndex >= query.customFilters.length) return false;

  const newFilters = [...query.customFilters];
  const [removed] = newFilters.splice(fromIndex, 1);
  newFilters.splice(toIndex, 0, removed);

  updateQuery(queryId, { customFilters: newFilters });
  logger.store('jql', 'Reordered custom filters', { queryId, fromIndex, toIndex });
  return true;
}

/**
 * Persist items to storage
 */
function persistItems(): void {
  saveStorage(STORAGE_KEYS.QUERIES, jqlState.items);
}
