/**
 * Keyboard Navigation Store
 * Manages focus state for tree keyboard navigation
 */

import type { TreeNode } from '../types';
import { flattenTree, findNode } from '../utils/hierarchy-builder';
import { issuesState, toggleNode } from './issues.svelte';
import { getIssueUrl } from './issues.svelte';

// State container for keyboard navigation
export const keyboardNavState = $state({
  focusedKey: null as string | null,
  isNavigating: false
});

/**
 * Get visible (flattened) nodes for navigation
 */
export function getVisibleNodes(): TreeNode[] {
  return flattenTree(issuesState.treeNodes);
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
 * Open focused issue in JIRA
 */
export function openFocusedIssue(): void {
  if (!keyboardNavState.focusedKey) return;

  const url = getIssueUrl(keyboardNavState.focusedKey);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Handle keyboard events for tree navigation
 */
export function handleTreeKeydown(event: KeyboardEvent): boolean {
  // Ignore if typing in an input
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return false;
  }

  // Ignore if no issues loaded
  if (issuesState.treeNodes.length === 0 || issuesState.isLoading) {
    return false;
  }

  switch (event.key) {
    case 'ArrowDown':
    case 'j': // vim-style
      event.preventDefault();
      focusNext();
      return true;

    case 'ArrowUp':
    case 'k': // vim-style
      event.preventDefault();
      focusPrevious();
      return true;

    case 'ArrowRight':
    case 'l': // vim-style
      event.preventDefault();
      expandOrDescend();
      return true;

    case 'ArrowLeft':
    case 'h': // vim-style
      event.preventDefault();
      collapseOrAscend();
      return true;

    case 'Home':
      event.preventDefault();
      focusFirst();
      return true;

    case 'End':
      event.preventDefault();
      focusLast();
      return true;

    case 'Enter':
      event.preventDefault();
      openFocusedIssue();
      return true;

    case ' ': // Space
      event.preventDefault();
      toggleFocusedNode();
      return true;

    case 'Escape':
      event.preventDefault();
      clearFocus();
      return true;

    default:
      return false;
  }
}
