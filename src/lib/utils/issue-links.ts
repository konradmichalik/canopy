/**
 * Issue Links Utility Functions
 * Analyzes Jira issue links for blocking/dependency relationships
 */

import type { JiraIssueLink, JiraStatus } from '../types/jira';

// ============================================
// Types
// ============================================

export interface LinkedIssueInfo {
  key: string;
  summary: string;
  status: JiraStatus;
  linkType: string;
}

export interface BlockingState {
  isBlocked: boolean;
  isBlocking: boolean;
  blockedByIssues: LinkedIssueInfo[];
  blockingIssues: LinkedIssueInfo[];
}

// ============================================
// Link Type Detection
// ============================================

// Patterns that indicate "this issue is blocked/depends on another"
const BLOCKED_BY_PATTERNS = [/is blocked by/i, /depends on/i, /requires/i, /is prevented by/i];

// Patterns that indicate "this issue blocks/is required by another"
const BLOCKS_PATTERNS = [/blocks/i, /is required by/i, /is depended on by/i, /prevents/i];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ============================================
// Functions
// ============================================

/**
 * Extract blocking state from issue links
 */
export function getBlockingState(links: JiraIssueLink[] | undefined): BlockingState {
  const state: BlockingState = {
    isBlocked: false,
    isBlocking: false,
    blockedByIssues: [],
    blockingIssues: []
  };

  if (!links?.length) return state;

  for (const link of links) {
    // Check inward links (e.g., "is blocked by KEY-123")
    if (link.inwardIssue && matchesAny(link.type.inward, BLOCKED_BY_PATTERNS)) {
      state.isBlocked = true;
      state.blockedByIssues.push({
        key: link.inwardIssue.key,
        summary: link.inwardIssue.fields.summary,
        status: link.inwardIssue.fields.status,
        linkType: link.type.inward
      });
    }

    // Check outward links (e.g., "blocks KEY-456")
    if (link.outwardIssue && matchesAny(link.type.outward, BLOCKS_PATTERNS)) {
      state.isBlocking = true;
      state.blockingIssues.push({
        key: link.outwardIssue.key,
        summary: link.outwardIssue.fields.summary,
        status: link.outwardIssue.fields.status,
        linkType: link.type.outward
      });
    }
  }

  return state;
}

/**
 * Get tooltip text for blocking state
 */
export function getIndicatorTooltip(state: BlockingState): string {
  const parts: string[] = [];

  if (state.blockedByIssues.length > 0) {
    parts.push(`Blocked by: ${state.blockedByIssues.map((i) => i.key).join(', ')}`);
  }

  if (state.blockingIssues.length > 0) {
    parts.push(`Blocks: ${state.blockingIssues.map((i) => i.key).join(', ')}`);
  }

  return parts.join(' | ');
}
