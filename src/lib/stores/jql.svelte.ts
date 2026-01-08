/**
 * JQL Queries Store
 * Manages saved queries with Svelte 5 Runes
 */

import type { SavedQuery, QueryColor, SortConfig, GroupByOption } from '../types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { generateQueryId } from '../types/tree';
import { logger } from '../utils/logger';
import { generateSlug, slugsMatch } from '../utils/slug';

// State container object
export const jqlState = $state({
  queries: [] as SavedQuery[]
});

/**
 * Initialize queries from storage
 */
export function initializeQueries(): void {
  const stored = getStorageItem<SavedQuery[]>(STORAGE_KEYS.QUERIES);

  if (stored && Array.isArray(stored)) {
    jqlState.queries = stored;
    logger.store('jql', 'Loaded queries from storage', { count: jqlState.queries.length });
  } else {
    jqlState.queries = [];
    logger.store('jql', 'No stored queries found');
  }
}

/**
 * Get all queries
 */
export function getQueries(): SavedQuery[] {
  return jqlState.queries;
}

/**
 * Get a query by ID
 */
export function getQueryById(id: string): SavedQuery | undefined {
  return jqlState.queries.find((q) => q.id === id);
}

/**
 * Get a query by slug (URL-friendly title)
 */
export function getQueryBySlug(slug: string): SavedQuery | undefined {
  return jqlState.queries.find((q) => generateSlug(q.title) === slug);
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
  return !jqlState.queries.some((q) => q.id !== excludeId && slugsMatch(q.title, title));
}

/**
 * Add a new query
 */
export function addQuery(title: string, jql: string, color?: QueryColor): SavedQuery {
  const now = new Date().toISOString();
  const newQuery: SavedQuery = {
    id: generateQueryId(),
    title: title.trim(),
    jql: jql.trim(),
    color,
    createdAt: now,
    updatedAt: now
  };

  jqlState.queries = [...jqlState.queries, newQuery];
  persistQueries();
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
  const index = jqlState.queries.findIndex((q) => q.id === id);

  if (index === -1) {
    logger.warn(`Query ${id} not found for update`);
    return false;
  }

  const updated: SavedQuery = {
    ...jqlState.queries[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  jqlState.queries = [
    ...jqlState.queries.slice(0, index),
    updated,
    ...jqlState.queries.slice(index + 1)
  ];
  persistQueries();
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
 * Delete a query
 */
export function deleteQuery(id: string): boolean {
  const index = jqlState.queries.findIndex((q) => q.id === id);

  if (index === -1) {
    logger.warn(`Query ${id} not found for deletion`);
    return false;
  }

  jqlState.queries = [...jqlState.queries.slice(0, index), ...jqlState.queries.slice(index + 1)];
  persistQueries();
  logger.store('jql', 'Deleted query', { id });

  return true;
}

/**
 * Reorder queries
 */
export function reorderQueries(fromIndex: number, toIndex: number): void {
  if (fromIndex < 0 || fromIndex >= jqlState.queries.length) return;
  if (toIndex < 0 || toIndex >= jqlState.queries.length) return;

  const newQueries = [...jqlState.queries];
  const [removed] = newQueries.splice(fromIndex, 1);
  newQueries.splice(toIndex, 0, removed);

  jqlState.queries = newQueries;
  persistQueries();
}

/**
 * Set default query
 */
export function setDefaultQuery(id: string): void {
  jqlState.queries = jqlState.queries.map((q) => ({
    ...q,
    isDefault: q.id === id
  }));
  persistQueries();
}

/**
 * Get default query
 */
export function getDefaultQuery(): SavedQuery | undefined {
  return jqlState.queries.find((q) => q.isDefault) || jqlState.queries[0];
}

/**
 * Add an already-constructed query (e.g., from import)
 */
export function addImportedQuery(query: SavedQuery): void {
  jqlState.queries = [...jqlState.queries, query];
  persistQueries();
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
      id: generateQueryId(),
      createdAt: q.createdAt || now,
      updatedAt: now
    };
    jqlState.queries = [...jqlState.queries, newQuery];
    imported++;
  });

  persistQueries();
  logger.store('jql', 'Imported queries', { count: imported });

  return imported;
}

/**
 * Export queries as JSON
 */
export function exportQueries(): string {
  return JSON.stringify(jqlState.queries, null, 2);
}

/**
 * Persist queries to storage
 */
function persistQueries(): void {
  setStorageItem(STORAGE_KEYS.QUERIES, jqlState.queries);
}
