/**
 * Issues Store
 * Manages loaded issues and tree structure
 */

import type { JiraIssue, TreeNode } from '../types';
import { getClient, getEpicLinkFieldId } from './connection.svelte';
import {
  buildHierarchy,
  toggleNode as toggleNodeInTree,
  expandAll as expandAllNodes,
  collapseAll as collapseAllNodes,
  getExpandedKeys,
  getTreeStats
} from '../utils/hierarchy-builder';
import { applyQuickFilters, setOrderBy, hasOrderByClause } from '../utils/jql-helpers';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';
import {
  getActiveFilterConditions,
  setFiltersChangeCallback,
  updateDynamicFilters,
  filterIssuesBySearchText,
  filterIssuesByRecency,
  filtersState
} from './filters.svelte';
import { getSortConfig, setSortConfigChangeCallback } from './sortConfig.svelte';
import { invalidateFlatTreeCache } from './keyboardNavigation.svelte';
import { routerState } from './router.svelte';
import { updateQueryIssueCount } from './jql.svelte';
import { detectChanges, changeTrackingState } from './changeTracking.svelte';

// Configuration constants for large result handling
export const LARGE_RESULT_THRESHOLD = 1000; // Show warning above this count
export const BATCH_SIZE = 500; // Issues per batch

// State container object
export const issuesState = $state({
  rawIssues: [] as JiraIssue[],
  treeNodes: [] as TreeNode[],
  isLoading: false,
  error: null as string | null,
  currentJql: '',
  isInitialLoad: true,
  lastUpdated: null as Date | null,

  // Pagination state for large result sets
  totalCount: 0, // Total issues matching JQL (from count check)
  loadedCount: 0, // Number of issues currently loaded
  isPartialLoad: false, // Whether current view is partial (more available)
  isLoadingMore: false, // Loading more issues (distinct from initial load)
  nextPageToken: null as string | null, // Cloud pagination
  nextStartAt: 0 // Server pagination
});

// Track if a reload is pending (triggered while loading)
let pendingReload = false;

// Track which query started the current load (to avoid race conditions when switching queries quickly)
let loadingQueryId: string | null = null;

// Set up filter change callback
setFiltersChangeCallback(() => {
  if (issuesState.currentJql) {
    if (issuesState.isLoading) {
      // Schedule reload after current load completes
      pendingReload = true;
    } else {
      issuesState.isInitialLoad = false;
      // Clear change tracking summary - filter changes are internal, not external changes
      changeTrackingState.currentChanges = null;
      loadIssues(issuesState.currentJql);
    }
  }
});

// Set up sort config change callback (reloads issues with new ORDER BY)
setSortConfigChangeCallback(() => {
  if (issuesState.currentJql && !issuesState.isLoading) {
    // Only reload if the base JQL doesn't have its own ORDER BY
    if (!hasOrderByClause(issuesState.currentJql)) {
      issuesState.isInitialLoad = false;
      // Clear change tracking summary - sort changes are internal, not external changes
      changeTrackingState.currentChanges = null;
      loadIssues(issuesState.currentJql);
    }
  }
});

// --- Helper functions (DRY) ---

/**
 * Build effective JQL with filters and sorting applied
 */
function getEffectiveJql(baseJql: string): { jql: string; filterConditions: string[] } {
  const filterConditions = getActiveFilterConditions();
  let jql = applyQuickFilters(baseJql, filterConditions);
  if (!hasOrderByClause(baseJql)) {
    const sortConfig = getSortConfig();
    jql = setOrderBy(jql, sortConfig.field, sortConfig.direction);
  }
  return { jql, filterConditions };
}

/**
 * Apply local filters and rebuild tree hierarchy
 */
async function applyLocalFiltersAndBuildTree(issues: JiraIssue[]): Promise<void> {
  let filteredIssues = filterIssuesBySearchText(issues);
  filteredIssues = filterIssuesByRecency(filteredIssues);
  issuesState.rawIssues = filteredIssues;

  const savedExpandedKeys = await getStorageItemAsync<string[]>(STORAGE_KEYS.EXPANDED_NODES);
  const expandedKeys = savedExpandedKeys ? new Set(savedExpandedKeys) : new Set<string>();

  issuesState.treeNodes = buildHierarchy(issuesState.rawIssues, {
    epicLinkFieldId: getEpicLinkFieldId() || undefined,
    expandedKeys,
    sortConfig: getSortConfig()
  });
}

// --- Public API ---

/**
 * Pre-check issue count before loading
 * Returns { total, needsWarning } to determine if warning modal should be shown
 */
export async function preCheckIssueCount(
  jql: string
): Promise<{ total: number; needsWarning: boolean }> {
  const client = getClient();
  if (!client) {
    throw new Error('Not connected to Jira');
  }

  // Apply quick filters to get accurate count
  const filterConditions = getActiveFilterConditions();
  const effectiveJql = applyQuickFilters(jql, filterConditions);

  const total = await client.getIssueCount(effectiveJql);

  return {
    total,
    needsWarning: total > LARGE_RESULT_THRESHOLD
  };
}

export interface LoadIssuesOptions {
  loadAll?: boolean; // If true, loads all issues (ignores threshold)
  maxResults?: number; // Maximum issues to load per batch
}

/**
 * Load issues for a JQL query
 */
export async function loadIssues(jql: string, options: LoadIssuesOptions = {}): Promise<boolean> {
  const { loadAll = false, maxResults = BATCH_SIZE } = options;
  const client = getClient();

  if (!client) {
    issuesState.error = 'Not connected to Jira';
    return false;
  }

  // If the JQL changed, this is a new initial load - reset pagination state
  if (issuesState.currentJql !== jql) {
    issuesState.isInitialLoad = true;
    issuesState.nextPageToken = null;
    issuesState.nextStartAt = 0;
  }

  issuesState.isLoading = true;
  issuesState.error = null;
  issuesState.currentJql = jql;

  // Capture the query ID at load start to avoid race conditions when switching queries quickly
  loadingQueryId = routerState.activeQueryId;

  try {
    const { jql: effectiveJql, filterConditions } = getEffectiveJql(jql);
    logger.info('Loading issues', { jql: effectiveJql, filters: filterConditions, loadAll });

    let fetchedIssues: JiraIssue[];

    if (loadAll) {
      // Load all issues (existing behavior)
      fetchedIssues = await client.fetchAllIssues(effectiveJql);
      issuesState.totalCount = fetchedIssues.length;
      issuesState.loadedCount = fetchedIssues.length;
      issuesState.isPartialLoad = false;
      issuesState.nextPageToken = null;
      issuesState.nextStartAt = 0;
    } else {
      // Load limited batch
      const result = await client.fetchIssuesBatch(effectiveJql, { maxResults });
      fetchedIssues = result.issues;
      issuesState.totalCount = result.total;
      issuesState.loadedCount = result.issues.length;
      issuesState.isPartialLoad = result.hasMore;
      issuesState.nextPageToken = result.nextPageToken ?? null;
      issuesState.nextStartAt = result.nextStartAt ?? 0;
    }

    // Update dynamic filters
    // On initial load: replace all filters with fresh data
    // On subsequent loads (with filters active): merge to preserve existing filter options
    updateDynamicFilters(fetchedIssues, { replace: issuesState.isInitialLoad });

    // Apply local filters and build tree
    await applyLocalFiltersAndBuildTree(fetchedIssues);

    const stats = getTreeStats(issuesState.treeNodes);
    logger.info('Issues loaded', stats);

    // Update last updated timestamp
    issuesState.lastUpdated = new Date();

    // Update cached issue count for the query that started this load
    // Use totalCount (not loadedCount) for the badge to show actual query size
    if (loadingQueryId) {
      updateQueryIssueCount(loadingQueryId, issuesState.totalCount);

      // Detect changes from checkpoint (only on initial load, full load, and when no filters are active)
      // Partial loads can't reliably detect changes since we don't have all issues
      const hasNoActiveFilters =
        filterConditions.length === 0 && !filtersState.searchText && !filtersState.recencyFilter;

      if (issuesState.isInitialLoad && !issuesState.isPartialLoad && hasNoActiveFilters) {
        detectChanges(loadingQueryId, fetchedIssues);
      } else if (issuesState.isInitialLoad && !hasNoActiveFilters) {
        // Clear any stale change detection when filters are active
        changeTrackingState.currentChanges = null;
      }
    }

    issuesState.isLoading = false;

    // Check if a reload was requested while loading (e.g., filters were activated)
    if (pendingReload) {
      pendingReload = false;
      issuesState.isInitialLoad = false;
      // Clear change tracking summary - pending reload is from internal changes (filters)
      changeTrackingState.currentChanges = null;
      // Use setTimeout to avoid potential recursion issues
      setTimeout(() => loadIssues(issuesState.currentJql), 0);
    }

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load issues';
    issuesState.error = message;
    issuesState.isLoading = false;
    pendingReload = false; // Clear pending reload on error
    logger.error('Failed to load issues', err);
    return false;
  }
}

/**
 * Refresh current issues
 */
export async function refreshIssues(): Promise<boolean> {
  if (!issuesState.currentJql) {
    return false;
  }
  return loadIssues(issuesState.currentJql);
}

/**
 * Load additional issues (append to existing)
 * Called when user clicks "Load more" button
 */
export async function loadMoreIssues(batchSize: number = BATCH_SIZE): Promise<boolean> {
  const client = getClient();

  if (!client || !issuesState.isPartialLoad) {
    return false;
  }

  issuesState.isLoadingMore = true;

  try {
    const { jql: effectiveJql } = getEffectiveJql(issuesState.currentJql);

    const result = await client.fetchIssuesBatch(effectiveJql, {
      maxResults: batchSize,
      startAt: issuesState.nextStartAt,
      nextPageToken: issuesState.nextPageToken ?? undefined
    });

    // Update pagination state
    issuesState.loadedCount = issuesState.loadedCount + result.issues.length;
    issuesState.isPartialLoad = result.hasMore;
    issuesState.nextPageToken = result.nextPageToken ?? null;
    issuesState.nextStartAt = result.nextStartAt ?? issuesState.loadedCount;

    // Append new issues and rebuild tree
    const allIssues = [...issuesState.rawIssues, ...result.issues];
    await applyLocalFiltersAndBuildTree(allIssues);

    logger.info(`Loaded ${result.issues.length} more issues, total: ${issuesState.loadedCount}`);

    issuesState.isLoadingMore = false;
    return true;
  } catch (err) {
    issuesState.error = err instanceof Error ? err.message : 'Failed to load more issues';
    issuesState.isLoadingMore = false;
    logger.error('Failed to load more issues', err);
    return false;
  }
}

/**
 * Load all remaining issues
 */
export async function loadAllRemainingIssues(): Promise<boolean> {
  while (issuesState.isPartialLoad) {
    const success = await loadMoreIssues();
    if (!success) return false;
  }
  return true;
}

/**
 * Toggle node expansion
 */
export function toggleNode(key: string): void {
  issuesState.treeNodes = toggleNodeInTree(issuesState.treeNodes, key);
  invalidateFlatTreeCache(); // Invalidate keyboard navigation cache
  persistExpandedKeys();
}

/**
 * Expand all nodes
 */
export function expandAll(): void {
  issuesState.treeNodes = expandAllNodes(issuesState.treeNodes);
  invalidateFlatTreeCache(); // Invalidate keyboard navigation cache
  persistExpandedKeys();
}

/**
 * Collapse all nodes
 */
export function collapseAll(): void {
  issuesState.treeNodes = collapseAllNodes(issuesState.treeNodes);
  invalidateFlatTreeCache(); // Invalidate keyboard navigation cache
  persistExpandedKeys();
}

/**
 * Reload issues with current filters
 * Called when filters change
 */
export function reloadWithFilters(): void {
  if (issuesState.currentJql && !issuesState.isLoading) {
    loadIssues(issuesState.currentJql);
  }
}

/**
 * Rebuild tree with current sort config (without refetching from API)
 */
export async function rebuildTree(): Promise<void> {
  if (issuesState.rawIssues.length === 0) return;

  const savedExpandedKeys = await getStorageItemAsync<string[]>(STORAGE_KEYS.EXPANDED_NODES);
  const expandedKeys = savedExpandedKeys ? new Set(savedExpandedKeys) : new Set<string>();

  issuesState.treeNodes = buildHierarchy(issuesState.rawIssues, {
    epicLinkFieldId: getEpicLinkFieldId() || undefined,
    expandedKeys,
    sortConfig: getSortConfig()
  });

  logger.info('Tree rebuilt with updated sort config');
}

/**
 * Check if current JQL has an ORDER BY clause
 */
export function hasJqlOrderBy(): boolean {
  if (!issuesState.currentJql) return false;
  return /\bORDER\s+BY\b/i.test(issuesState.currentJql);
}

/**
 * Clear all data
 */
export function clearIssues(): void {
  issuesState.rawIssues = [];
  issuesState.treeNodes = [];
  issuesState.currentJql = '';
  issuesState.error = null;
  issuesState.lastUpdated = null;
  invalidateFlatTreeCache(); // Invalidate keyboard navigation cache
}

/**
 * Get issue URL
 */
export function getIssueUrl(issueKey: string): string | null {
  const client = getClient();
  return client?.getIssueUrl(issueKey) || null;
}

/**
 * Persist expanded keys to storage
 */
function persistExpandedKeys(): void {
  const keys = getExpandedKeys(issuesState.treeNodes);
  saveStorage(STORAGE_KEYS.EXPANDED_NODES, Array.from(keys));
}
