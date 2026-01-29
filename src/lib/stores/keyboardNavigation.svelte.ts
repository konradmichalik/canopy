/**
 * Keyboard Navigation Store
 * Manages focus state for tree and sidebar keyboard navigation
 * Provides global keyboard shortcuts when TreeView or Sidebar is active
 */

import type { TreeNode, SavedQuery } from '../types';
import { flattenTree, findNode } from '../utils/hierarchy-builder';
import { issuesState, toggleNode } from './issues.svelte';
import { getIssueUrl } from './issues.svelte';
import { routerState } from './router.svelte';
import { openExternalUrl } from '../utils/external-link';
import { jqlState } from './jql.svelte';
import { isQuery } from '../types/tree';

// State container for keyboard navigation
export const keyboardNavState = $state({
  focusedKey: null as string | null,
  isNavigating: false,
  // Sidebar navigation: -1 = tree focused, >= 0 = sidebar query index
  focusedQueryIndex: -1
});

/**
 * Check if keyboard event should be ignored (input fields, modals)
 */
function shouldIgnoreKeyEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    !!document.querySelector('[role="dialog"]')
  );
}

/**
 * Get navigable queries (excluding separators)
 */
function getNavigableQueries(): SavedQuery[] {
  return jqlState.items.filter(isQuery) as SavedQuery[];
}

// Track the previous query ID to detect changes
let previousQueryId: string | null = null;

// Clear focus when query changes
$effect.root(() => {
  $effect(() => {
    const currentQueryId = routerState.activeQueryId;
    if (previousQueryId !== null && currentQueryId !== previousQueryId) {
      // Query changed - clear focus
      keyboardNavState.focusedKey = null;
      keyboardNavState.isNavigating = false;
    }
    previousQueryId = currentQueryId;
  });
});

// Cached flattened tree for performance
let cachedFlattenedTree: TreeNode[] = [];
let cachedTreeNodesRef: TreeNode[] | null = null;

/**
 * Get visible (flattened) nodes for navigation
 * Uses cached value when tree structure hasn't changed
 */
export function getVisibleNodes(): TreeNode[] {
  // Check if cache is still valid (same tree reference)
  if (cachedTreeNodesRef === issuesState.treeNodes && cachedFlattenedTree.length > 0) {
    return cachedFlattenedTree;
  }

  // Rebuild cache
  cachedFlattenedTree = flattenTree(issuesState.treeNodes);
  cachedTreeNodesRef = issuesState.treeNodes;
  return cachedFlattenedTree;
}

/**
 * Invalidate the flattened tree cache
 * Call this when expand/collapse state changes
 */
export function invalidateFlatTreeCache(): void {
  cachedTreeNodesRef = null;
  cachedFlattenedTree = [];
}

/**
 * Get current focused node index in visible nodes
 */
function getFocusedIndex(visibleNodes: TreeNode[]): number {
  if (!keyboardNavState.focusedKey) return -1;
  return visibleNodes.findIndex((n) => n.issue.key === keyboardNavState.focusedKey);
}

/**
 * Set focus to a specific issue key
 */
export function setFocusedKey(key: string | null): void {
  keyboardNavState.focusedKey = key;
  keyboardNavState.isNavigating = key !== null;
}

/**
 * Clear focus
 */
export function clearFocus(): void {
  keyboardNavState.focusedKey = null;
  keyboardNavState.isNavigating = false;
}

/**
 * Move focus to next visible node
 */
export function focusNext(): void {
  const visibleNodes = getVisibleNodes();
  if (visibleNodes.length === 0) return;

  const currentIndex = getFocusedIndex(visibleNodes);
  const nextIndex = currentIndex < visibleNodes.length - 1 ? currentIndex + 1 : 0;
  setFocusedKey(visibleNodes[nextIndex].issue.key);
}

/**
 * Move focus to previous visible node
 */
export function focusPrevious(): void {
  const visibleNodes = getVisibleNodes();
  if (visibleNodes.length === 0) return;

  const currentIndex = getFocusedIndex(visibleNodes);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleNodes.length - 1;
  setFocusedKey(visibleNodes[prevIndex].issue.key);
}

/**
 * Move focus to first visible node
 */
export function focusFirst(): void {
  const visibleNodes = getVisibleNodes();
  if (visibleNodes.length === 0) return;
  setFocusedKey(visibleNodes[0].issue.key);
}

/**
 * Move focus to last visible node
 */
export function focusLast(): void {
  const visibleNodes = getVisibleNodes();
  if (visibleNodes.length === 0) return;
  setFocusedKey(visibleNodes[visibleNodes.length - 1].issue.key);
}

/**
 * Expand focused node or move to first child
 */
export function expandOrDescend(): void {
  if (!keyboardNavState.focusedKey) return;

  const node = findNode(issuesState.treeNodes, keyboardNavState.focusedKey);
  if (!node) return;

  if (node.children.length > 0) {
    if (node.isExpanded) {
      // Already expanded, move to first child
      setFocusedKey(node.children[0].issue.key);
    } else {
      // Expand node
      toggleNode(keyboardNavState.focusedKey);
    }
  }
}

/**
 * Collapse focused node or move to parent
 * If at root level with no parent and already collapsed, switch to sidebar
 */
export function collapseOrAscend(): void {
  if (!keyboardNavState.focusedKey) return;

  const node = findNode(issuesState.treeNodes, keyboardNavState.focusedKey);
  if (!node) return;

  if (node.isExpanded && node.children.length > 0) {
    // Collapse node
    toggleNode(keyboardNavState.focusedKey);
  } else if (node.parentKey) {
    // Move to parent
    setFocusedKey(node.parentKey);
  } else {
    // At root level with no parent and collapsed - switch to sidebar
    focusSidebar();
  }
}

/**
 * Toggle expand/collapse of focused node
 */
export function toggleFocusedNode(): void {
  if (!keyboardNavState.focusedKey) return;

  const node = findNode(issuesState.treeNodes, keyboardNavState.focusedKey);
  if (!node || node.children.length === 0) return;

  toggleNode(keyboardNavState.focusedKey);
}

/**
 * Open focused issue in Jira
 */
export function openFocusedIssue(): void {
  if (!keyboardNavState.focusedKey) return;

  const url = getIssueUrl(keyboardNavState.focusedKey);
  if (url) {
    openExternalUrl(url);
  }
}

// ============================================
// Sidebar Navigation
// ============================================

/**
 * Switch focus to sidebar query list
 */
export function focusSidebar(): void {
  const queries = getNavigableQueries();
  if (queries.length === 0) return;

  // Start at active query or first query
  let startIndex = 0;
  if (routerState.activeQueryId) {
    const activeIdx = queries.findIndex((q) => q.id === routerState.activeQueryId);
    if (activeIdx !== -1) startIndex = activeIdx;
  }

  keyboardNavState.focusedQueryIndex = startIndex;
}

/**
 * Clear sidebar focus (return to tree)
 */
export function clearSidebarFocus(): void {
  keyboardNavState.focusedQueryIndex = -1;
}

/**
 * Get currently focused query (for visual highlight)
 */
export function getFocusedQuery(): SavedQuery | null {
  if (keyboardNavState.focusedQueryIndex < 0) return null;
  const queries = getNavigableQueries();
  return queries[keyboardNavState.focusedQueryIndex] ?? null;
}

/**
 * Handle sidebar keyboard navigation
 * Returns the selected query if Enter/Right was pressed, null otherwise
 */
function handleSidebarKeydown(event: KeyboardEvent): SavedQuery | null | 'handled' {
  if (keyboardNavState.focusedQueryIndex < 0) return null;
  if (shouldIgnoreKeyEvent(event)) return null;

  const queries = getNavigableQueries();
  if (queries.length === 0) return null;

  switch (event.key) {
    case 'ArrowDown':
    case 'j':
      event.preventDefault();
      keyboardNavState.focusedQueryIndex =
        keyboardNavState.focusedQueryIndex < queries.length - 1
          ? keyboardNavState.focusedQueryIndex + 1
          : 0;
      return 'handled';

    case 'ArrowUp':
    case 'k':
      event.preventDefault();
      keyboardNavState.focusedQueryIndex =
        keyboardNavState.focusedQueryIndex > 0
          ? keyboardNavState.focusedQueryIndex - 1
          : queries.length - 1;
      return 'handled';

    case 'ArrowRight':
    case 'l':
    case 'Enter':
      event.preventDefault();
      const selectedQuery = queries[keyboardNavState.focusedQueryIndex];
      keyboardNavState.focusedQueryIndex = -1;
      keyboardNavState.focusedKey = null;
      return selectedQuery ?? null;

    case 'Escape':
      event.preventDefault();
      keyboardNavState.focusedQueryIndex = -1;
      return 'handled';
  }

  return null;
}

// Callback for query selection (set by Sidebar)
let onQuerySelectCallback: ((query: SavedQuery) => void) | null = null;

/**
 * Register callback for query selection
 */
export function onQuerySelect(callback: (query: SavedQuery) => void): () => void {
  onQuerySelectCallback = callback;
  return () => {
    onQuerySelectCallback = null;
  };
}

/**
 * Handle keyboard events for tree navigation
 */
function handleTreeKeydown(event: KeyboardEvent): void {
  // Check sidebar navigation first
  const sidebarResult = handleSidebarKeydown(event);
  if (sidebarResult === 'handled') return;
  if (sidebarResult && onQuerySelectCallback) {
    onQuerySelectCallback(sidebarResult);
    return;
  }

  if (shouldIgnoreKeyEvent(event)) return;

  // No active query - nav keys switch to sidebar
  if (!routerState.activeQueryId) {
    if (['ArrowDown', 'ArrowUp', 'j', 'k', 'ArrowLeft', 'h'].includes(event.key)) {
      event.preventDefault();
      focusSidebar();
    }
    return;
  }

  // No issues or loading - only left arrow switches to sidebar
  if (issuesState.treeNodes.length === 0 || issuesState.isLoading) {
    if (['ArrowLeft', 'h'].includes(event.key)) {
      event.preventDefault();
      focusSidebar();
    }
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
    case 'j':
      event.preventDefault();
      focusNext();
      break;
    case 'ArrowUp':
    case 'k':
      event.preventDefault();
      focusPrevious();
      break;
    case 'ArrowRight':
    case 'l':
      event.preventDefault();
      expandOrDescend();
      break;
    case 'ArrowLeft':
    case 'h':
      event.preventDefault();
      collapseOrAscend();
      break;
    case 'Home':
      event.preventDefault();
      focusFirst();
      break;
    case 'End':
      event.preventDefault();
      focusLast();
      break;
    case 'Enter':
      event.preventDefault();
      openFocusedIssue();
      break;
    case ' ':
      event.preventDefault();
      toggleFocusedNode();
      break;
    case 'Escape':
      event.preventDefault();
      clearFocus();
      break;
  }
}

let isListenerActive = false;

export function initializeKeyboardNavigation(): void {
  if (isListenerActive) return;
  window.addEventListener('keydown', handleTreeKeydown);
  isListenerActive = true;
}

export function cleanupKeyboardNavigation(): void {
  window.removeEventListener('keydown', handleTreeKeydown);
  isListenerActive = false;
}
