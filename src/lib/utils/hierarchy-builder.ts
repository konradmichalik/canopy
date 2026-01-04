/**
 * Hierarchy Builder
 * Converts flat issue list into tree structure
 */

import type { JiraIssue, TreeNode } from '../types';
import { getHierarchyLevel, compareByHierarchy, HIERARCHY_ORDER } from '../types/tree';
import { logger } from './logger';

interface BuildOptions {
  epicLinkFieldId?: string;
  expandedKeys?: Set<string>;
}

/**
 * Build a tree structure from a flat list of JIRA issues
 */
export function buildHierarchy(
  issues: JiraIssue[],
  options: BuildOptions = {}
): TreeNode[] {
  const { epicLinkFieldId, expandedKeys = new Set() } = options;
  const timer = logger.time('buildHierarchy');

  // Create a map for quick lookup
  const issueMap = new Map<string, JiraIssue>();
  issues.forEach((issue) => issueMap.set(issue.key, issue));

  // Create tree nodes
  const nodeMap = new Map<string, TreeNode>();
  issues.forEach((issue) => {
    nodeMap.set(issue.key, {
      issue,
      children: [],
      depth: 0,
      isExpanded: expandedKeys.has(issue.key),
      isVisible: true,
      parentKey: null
    });
  });

  // Build parent-child relationships
  const rootNodes: TreeNode[] = [];
  let orphanCount = 0;

  issues.forEach((issue) => {
    const node = nodeMap.get(issue.key)!;
    const parentKey = findParentKey(issue, issueMap, epicLinkFieldId);

    // Debug: Log subtask parent relationships
    if (issue.fields.issuetype.subtask) {
      logger.debug(`Subtask ${issue.key} - parent field: ${issue.fields.parent?.key || 'none'}, found parent: ${parentKey || 'none'}`);
    }

    if (parentKey && nodeMap.has(parentKey)) {
      // Has a parent in our result set
      const parentNode = nodeMap.get(parentKey)!;
      node.parentKey = parentKey;
      node.depth = parentNode.depth + 1;
      parentNode.children.push(node);
      logger.debug(`${issue.key} -> parent ${parentKey} (children: ${parentNode.children.length})`);
    } else if (parentKey) {
      // Parent exists but not in our result set
      orphanCount++;
      logger.warn(`Issue ${issue.key} has parent ${parentKey} not in result set`);
      rootNodes.push(node);
    } else {
      // No parent - this is a root node
      rootNodes.push(node);
    }
  });

  // Sort children recursively
  sortChildrenRecursively(rootNodes);

  // Update depths recursively (in case we missed any)
  updateDepths(rootNodes, 0);

  const duration = timer();
  logger.hierarchy(
    `Built hierarchy: ${issues.length} issues -> ${rootNodes.length} root nodes (${duration}ms)`,
    { orphanCount, maxDepth: getMaxDepth(rootNodes) }
  );

  return rootNodes;
}

/**
 * Find the parent key for an issue
 */
function findParentKey(
  issue: JiraIssue,
  issueMap: Map<string, JiraIssue>,
  epicLinkFieldId?: string
): string | null {
  // 1. Check parent field (used in Cloud and for subtasks)
  if (issue.fields.parent?.key) {
    return issue.fields.parent.key;
  }

  // 2. Check Epic Link field (Server/DC)
  if (epicLinkFieldId && issue.fields[epicLinkFieldId]) {
    const epicKey = issue.fields[epicLinkFieldId] as string;
    if (typeof epicKey === 'string') {
      return epicKey;
    }
  }

  // 3. Check issue links for parent-child relationships
  if (issue.fields.issuelinks) {
    for (const link of issue.fields.issuelinks) {
      // Look for "is child of" or similar relationships
      if (
        link.type.inward?.toLowerCase().includes('child') ||
        link.type.inward?.toLowerCase().includes('parent')
      ) {
        if (link.inwardIssue && issueMap.has(link.inwardIssue.key)) {
          return link.inwardIssue.key;
        }
      }
      if (
        link.type.outward?.toLowerCase().includes('parent') &&
        link.outwardIssue
      ) {
        if (issueMap.has(link.outwardIssue.key)) {
          return link.outwardIssue.key;
        }
      }
    }
  }

  return null;
}

/**
 * Sort children recursively by hierarchy level and key
 */
function sortChildrenRecursively(nodes: TreeNode[]): void {
  nodes.sort(compareByHierarchy);
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      sortChildrenRecursively(node.children);
    }
  });
}

/**
 * Update depths recursively
 */
function updateDepths(nodes: TreeNode[], depth: number): void {
  nodes.forEach((node) => {
    node.depth = depth;
    if (node.children.length > 0) {
      updateDepths(node.children, depth + 1);
    }
  });
}

/**
 * Get maximum depth in tree
 */
function getMaxDepth(nodes: TreeNode[], currentMax = 0): number {
  let max = currentMax;
  nodes.forEach((node) => {
    max = Math.max(max, node.depth);
    if (node.children.length > 0) {
      max = Math.max(max, getMaxDepth(node.children, max));
    }
  });
  return max;
}

/**
 * Flatten tree back to list (for display with indentation)
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(nodeList: TreeNode[]): void {
    nodeList.forEach((node) => {
      result.push(node);
      if (node.isExpanded && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);
  return result;
}

/**
 * Find a node by key
 */
export function findNode(nodes: TreeNode[], key: string): TreeNode | null {
  for (const node of nodes) {
    if (node.issue.key === key) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findNode(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Toggle node expansion
 */
export function toggleNode(nodes: TreeNode[], key: string): TreeNode[] {
  return nodes.map((node) => {
    if (node.issue.key === key) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children.length > 0) {
      return { ...node, children: toggleNode(node.children, key) };
    }
    return node;
  });
}

/**
 * Expand all nodes
 */
export function expandAll(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    isExpanded: true,
    children: node.children.length > 0 ? expandAll(node.children) : []
  }));
}

/**
 * Collapse all nodes
 */
export function collapseAll(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    isExpanded: false,
    children: node.children.length > 0 ? collapseAll(node.children) : []
  }));
}

/**
 * Get all expanded keys from tree
 */
export function getExpandedKeys(nodes: TreeNode[]): Set<string> {
  const keys = new Set<string>();

  function traverse(nodeList: TreeNode[]): void {
    nodeList.forEach((node) => {
      if (node.isExpanded) {
        keys.add(node.issue.key);
      }
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);
  return keys;
}

/**
 * Count total issues in tree
 */
export function countIssues(nodes: TreeNode[]): number {
  let count = 0;

  function traverse(nodeList: TreeNode[]): void {
    nodeList.forEach((node) => {
      count++;
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);
  return count;
}

/**
 * Get statistics about the tree
 */
export function getTreeStats(nodes: TreeNode[]): {
  totalIssues: number;
  rootNodes: number;
  maxDepth: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalIssues = 0;

  function traverse(nodeList: TreeNode[]): void {
    nodeList.forEach((node) => {
      totalIssues++;

      const typeName = node.issue.fields.issuetype.name;
      byType[typeName] = (byType[typeName] || 0) + 1;

      const statusName = node.issue.fields.status.name;
      byStatus[statusName] = (byStatus[statusName] || 0) + 1;

      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);

  return {
    totalIssues,
    rootNodes: nodes.length,
    maxDepth: getMaxDepth(nodes),
    byType,
    byStatus
  };
}
