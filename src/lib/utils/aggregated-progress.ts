/**
 * Aggregated Progress Calculations
 * Calculates time and resolution progress across tree nodes recursively
 */

import type { TreeNode, JiraIssue } from '../types';

// ============================================
// Types
// ============================================

export interface AggregatedTimeProgress {
  logged: number; // Seconds
  total: number; // Seconds
  percent: number;
}

export interface AggregatedResolutionProgress {
  done: number; // Count of done issues
  total: number; // Total count of descendant issues
  percent: number;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Get aggregated time progress from a node (pre-calculated during tree build)
 * O(1) lookup - values are cached in TreeNode
 */
export function calculateAggregatedTimeProgress(node: TreeNode): AggregatedTimeProgress {
  return node.cachedTimeProgress ?? { logged: 0, total: 0, percent: 0 };
}

/**
 * Get aggregated resolution progress from a node (pre-calculated during tree build)
 * O(1) lookup - values are cached in TreeNode
 */
export function calculateAggregatedResolutionProgress(
  node: TreeNode
): AggregatedResolutionProgress {
  return node.cachedResolutionProgress ?? { done: 0, total: 0, percent: 0 };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format seconds to hours string (e.g., "12h")
 */
export function formatHours(seconds: number): string {
  const hours = Math.round(seconds / 3600);
  return `${hours}h`;
}

/**
 * Check if a node has any time tracking data (self or descendants)
 * O(1) lookup - uses cached value
 */
export function hasTimeTrackingData(node: TreeNode): boolean {
  return (node.cachedTimeProgress?.total ?? 0) > 0;
}

/**
 * Check if a node has any descendants
 */
export function hasDescendants(node: TreeNode): boolean {
  return node.children.length > 0;
}

// ============================================
// Flat Issue Array Aggregation
// ============================================

/**
 * Calculate aggregated time progress from a flat array of issues
 */
export function calculateIssuesTimeProgress(issues: JiraIssue[]): AggregatedTimeProgress {
  let logged = 0;
  let total = 0;

  for (const issue of issues) {
    logged += issue.fields.progress?.progress ?? 0;
    total += issue.fields.progress?.total ?? 0;
  }

  return {
    logged,
    total,
    percent: total > 0 ? Math.round((logged / total) * 100) : 0
  };
}

/**
 * Calculate aggregated resolution progress from a flat array of issues
 */
export function calculateIssuesResolutionProgress(
  issues: JiraIssue[]
): AggregatedResolutionProgress {
  let done = 0;
  const total = issues.length;

  for (const issue of issues) {
    if (issue.fields.status.statusCategory.key === 'done') {
      done++;
    }
  }

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0
  };
}

/**
 * Check if any issues have time tracking data
 */
export function issuesHaveTimeTrackingData(issues: JiraIssue[]): boolean {
  return issues.some((issue) => (issue.fields.progress?.total ?? 0) > 0);
}
