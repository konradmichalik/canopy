/**
 * Aggregated Progress Calculations
 * Calculates time and resolution progress across tree nodes recursively
 */

import type { TreeNode } from '../types';

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
 * Calculate aggregated time progress from a node and all its descendants
 * Uses the progress field (logged time vs. estimated time)
 */
export function calculateAggregatedTimeProgress(node: TreeNode): AggregatedTimeProgress {
  let logged = node.issue.fields.progress?.progress ?? 0;
  let total = node.issue.fields.progress?.total ?? 0;

  // Recursively add children's progress
  for (const child of node.children) {
    const childProgress = calculateAggregatedTimeProgress(child);
    logged += childProgress.logged;
    total += childProgress.total;
  }

  return {
    logged,
    total,
    percent: total > 0 ? Math.round((logged / total) * 100) : 0
  };
}

/**
 * Calculate aggregated resolution progress from a node's descendants
 * Counts done vs. total descendant issues (based on statusCategory.key === 'done')
 */
export function calculateAggregatedResolutionProgress(node: TreeNode): AggregatedResolutionProgress {
  let done = 0;
  let total = 0;

  function countDescendants(n: TreeNode): void {
    for (const child of n.children) {
      total++;
      if (child.issue.fields.status.statusCategory.key === 'done') {
        done++;
      }
      countDescendants(child);
    }
  }

  countDescendants(node);

  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0
  };
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
 */
export function hasTimeTrackingData(node: TreeNode): boolean {
  const progress = calculateAggregatedTimeProgress(node);
  return progress.total > 0;
}

/**
 * Check if a node has any descendants
 */
export function hasDescendants(node: TreeNode): boolean {
  return node.children.length > 0;
}
