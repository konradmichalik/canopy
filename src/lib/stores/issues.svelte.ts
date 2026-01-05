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
import { applyQuickFilters } from '../utils/jql-helpers';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';
import {
  getActiveFilterConditions,
  setFiltersChangeCallback,
  updateDynamicFilters,
  filterIssuesBySearchText,
  filterIssuesByRecency
} from './filters.svelte';
import { getSortConfig, setSortConfigChangeCallback } from './sortConfig.svelte';

// State container object
export const issuesState = $state({
  rawIssues: [] as JiraIssue[],
  treeNodes: [] as TreeNode[],
  isLoading: false,
  error: null as string | null,
  currentJql: '',
  isInitialLoad: true
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
      loadIssues(issuesState.currentJql);
    }
  }
});

// Set up sort config change callback (rebuilds tree without refetching)
setSortConfigChangeCallback(() => {
  if (issuesState.rawIssues.length > 0 && !issuesState.isLoading) {
    rebuildTree();
  }
});

/**
 * Load issues for a JQL query
 */
export async function loadIssues(jql: string): Promise<boolean> {
  const client = getClient();

  if (!client) {
    issuesState.error = 'Not connected to JIRA';
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
    const effectiveJql = applyQuickFilters(jql, filterConditions);

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
    const savedExpandedKeys = getStorageItem<string[]>(STORAGE_KEYS.EXPANDED_NODES);
    const expandedKeys = savedExpandedKeys ? new Set(savedExpandedKeys) : new Set<string>();

    issuesState.treeNodes = buildHierarchy(issuesState.rawIssues, {
      epicLinkFieldId: getEpicLinkFieldId() || undefined,
      expandedKeys,
      sortConfig: getSortConfig()
    });

    const stats = getTreeStats(issuesState.treeNodes);
    logger.info('Issues loaded', stats);

    issuesState.isLoading = false;

    // Check if a reload was requested while loading (e.g., filters were activated)
    if (pendingReload) {
      pendingReload = false;
      issuesState.isInitialLoad = false;
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
  persistExpandedKeys();
}

/**
 * Expand all nodes
 */
export function expandAll(): void {
  issuesState.treeNodes = expandAllNodes(issuesState.treeNodes);
  persistExpandedKeys();
}

/**
 * Collapse all nodes
 */
export function collapseAll(): void {
  issuesState.treeNodes = collapseAllNodes(issuesState.treeNodes);
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
export function rebuildTree(): void {
  if (issuesState.rawIssues.length === 0) return;

  const savedExpandedKeys = getStorageItem<string[]>(STORAGE_KEYS.EXPANDED_NODES);
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
  setStorageItem(STORAGE_KEYS.EXPANDED_NODES, Array.from(keys));
}
