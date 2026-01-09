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

// State container object
export const issuesState = $state({
  rawIssues: [] as JiraIssue[],
  treeNodes: [] as TreeNode[],
  isLoading: false,
  error: null as string | null,
  currentJql: '',
  isInitialLoad: true,
  lastUpdated: null as Date | null
});

// Track if a reload is pending (triggered while loading)
let pendingReload = false;

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

/**
 * Load issues for a JQL query
 */
export async function loadIssues(jql: string): Promise<boolean> {
  const client = getClient();

  if (!client) {
    issuesState.error = 'Not connected to Jira';
    return false;
  }

  // If the JQL changed, this is a new initial load
  if (issuesState.currentJql !== jql) {
    issuesState.isInitialLoad = true;
  }

  issuesState.isLoading = true;
  issuesState.error = null;
  issuesState.currentJql = jql;

  try {
    // Apply quick filters if active
    const filterConditions = getActiveFilterConditions();
    let effectiveJql = applyQuickFilters(jql, filterConditions);

    // Apply sort config via ORDER BY (only if base JQL doesn't have ORDER BY)
    if (!hasOrderByClause(jql)) {
      const sortConfig = getSortConfig();
      effectiveJql = setOrderBy(effectiveJql, sortConfig.field, sortConfig.direction);
    }

    logger.info('Loading issues', { jql: effectiveJql, filters: filterConditions });

    const fetchedIssues = await client.fetchAllIssues(effectiveJql);

    // Update dynamic filters only on initial load (before any quick filters are applied)
    if (issuesState.isInitialLoad) {
      updateDynamicFilters(fetchedIssues);
    }

    // Apply local filters (text search and recency for 'recently-commented')
    let filteredIssues = filterIssuesBySearchText(fetchedIssues);
    filteredIssues = filterIssuesByRecency(filteredIssues);
    issuesState.rawIssues = filteredIssues;

    // Build hierarchy
    const savedExpandedKeys = await getStorageItemAsync<string[]>(STORAGE_KEYS.EXPANDED_NODES);
    const expandedKeys = savedExpandedKeys ? new Set(savedExpandedKeys) : new Set<string>();

    issuesState.treeNodes = buildHierarchy(issuesState.rawIssues, {
      epicLinkFieldId: getEpicLinkFieldId() || undefined,
      expandedKeys,
      sortConfig: getSortConfig()
    });

    const stats = getTreeStats(issuesState.treeNodes);
    logger.info('Issues loaded', stats);

    // Update last updated timestamp
    issuesState.lastUpdated = new Date();

    // Update cached issue count for the active query
    if (routerState.activeQueryId) {
      updateQueryIssueCount(routerState.activeQueryId, stats.totalIssues);

      // Detect changes from checkpoint (only on initial load and when no filters are active)
      // Filter changes would cause false positives (e.g., filtered-out issues appear as "removed")
      const hasNoActiveFilters =
        filterConditions.length === 0 && !filtersState.searchText && !filtersState.recencyFilter;

      if (issuesState.isInitialLoad && hasNoActiveFilters) {
        detectChanges(routerState.activeQueryId, fetchedIssues);
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
