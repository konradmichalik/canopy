/**
 * Issue Links Utility Functions
 * Analyzes Jira issue links for blocking/dependency relationships
 */

import type { JiraIssueLink, JiraStatus } from '../types/jira';
import { logger } from './logger';

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
  /** Issues that are actively blocking (not yet done) */
  activeBlockedByIssues: LinkedIssueInfo[];
  /** True if there's at least one active (non-done) blocker */
  isActivelyBlocked: boolean;
}

// ============================================
// Link Type Detection
// ============================================

// Patterns that indicate "this issue is blocked/depends on another"
// Includes English and German variations
const BLOCKED_BY_PATTERNS = [
  /is blocked by/i,
  /wird blockiert von/i,
  /depends on/i,
  /hängt ab von/i,
  /requires/i,
  /benötigt/i,
  /is prevented by/i,
  /wird verhindert von/i,
  /is cloned by/i, // Sometimes used for blocking
  /is duplicated by/i
];

// Patterns that indicate "this issue blocks/is required by another"
const BLOCKS_PATTERNS = [
  /blocks/i,
  /blockiert/i,
  /is required by/i,
  /wird benötigt von/i,
  /is depended on by/i,
  /prevents/i,
  /verhindert/i,
  /clones/i,
  /duplicates/i
];

function matchesAny(text: string | undefined, patterns: RegExp[]): boolean {
  if (!text) return false;
  return patterns.some((p) => p.test(text));
}

// ============================================
// Functions
// ============================================

/**
 * Check if an issue status indicates it's done (resolved)
 */
function isDone(status: JiraStatus): boolean {
  return status.statusCategory.key === 'done';
}

/**
 * Extract blocking state from issue links
 *
 * Jira issue links work as follows:
 * - Each link has a type with `inward` and `outward` descriptions
 * - Each link has EITHER `inwardIssue` OR `outwardIssue` (never both)
 * - If `inwardIssue` is set: the linked issue is in the "inward" direction
 *   e.g., for "Blocks" type: inwardIssue means "this issue is blocked by inwardIssue"
 * - If `outwardIssue` is set: the linked issue is in the "outward" direction
 *   e.g., for "Blocks" type: outwardIssue means "this issue blocks outwardIssue"
 */
export function getBlockingState(links: JiraIssueLink[] | undefined): BlockingState {
  const state: BlockingState = {
    isBlocked: false,
    isBlocking: false,
    blockedByIssues: [],
    blockingIssues: [],
    activeBlockedByIssues: [],
    isActivelyBlocked: false
  };

  if (!links?.length) return state;

  for (const link of links) {
    const inwardDesc = link.type.inward;
    const outwardDesc = link.type.outward;

    // Log all links for debugging (enable debug logging to see this)
    logger.debug('Issue link:', {
      type: link.type.name,
      inward: inwardDesc,
      outward: outwardDesc,
      inwardIssue: link.inwardIssue?.key,
      outwardIssue: link.outwardIssue?.key,
      inwardIssueStatus: link.inwardIssue?.fields?.status?.name,
      outwardIssueStatus: link.outwardIssue?.fields?.status?.name
    });

    // Case 1: inwardIssue present - check if it's a "blocked by" relationship
    // e.g., Current issue A has link with inwardIssue=B, type.inward="is blocked by"
    // Meaning: A "is blocked by" B (B blocks A)
    if (link.inwardIssue && matchesAny(inwardDesc, BLOCKED_BY_PATTERNS)) {
      state.isBlocked = true;
      const linkedIssue: LinkedIssueInfo = {
        key: link.inwardIssue.key,
        summary: link.inwardIssue.fields.summary,
        status: link.inwardIssue.fields.status,
        linkType: inwardDesc
      };
      state.blockedByIssues.push(linkedIssue);

      // Track active blockers (not done yet)
      if (!isDone(link.inwardIssue.fields.status)) {
        state.activeBlockedByIssues.push(linkedIssue);
        state.isActivelyBlocked = true;
        logger.debug(
          `Active blocker found: ${link.inwardIssue.key} (status: ${link.inwardIssue.fields.status.name})`
        );
      } else {
        logger.debug(
          `Resolved blocker found: ${link.inwardIssue.key} (status: ${link.inwardIssue.fields.status.name})`
        );
      }
    }

    // Case 2: outwardIssue present - check if it's a "blocks" relationship
    // e.g., Current issue A has link with outwardIssue=C, type.outward="blocks"
    // Meaning: A "blocks" C (A is blocking C)
    if (link.outwardIssue && matchesAny(outwardDesc, BLOCKS_PATTERNS)) {
      state.isBlocking = true;
      state.blockingIssues.push({
        key: link.outwardIssue.key,
        summary: link.outwardIssue.fields.summary,
        status: link.outwardIssue.fields.status,
        linkType: outwardDesc
      });
      logger.debug(`This issue blocks: ${link.outwardIssue.key}`);
    }
  }

  if (state.blockedByIssues.length > 0 || state.blockingIssues.length > 0) {
    logger.debug('Blocking state result:', {
      isBlocked: state.isBlocked,
      isActivelyBlocked: state.isActivelyBlocked,
      blockedByCount: state.blockedByIssues.length,
      activeBlockedByCount: state.activeBlockedByIssues.length,
      blockingCount: state.blockingIssues.length
    });
  }

  return state;
}

/**
 * Get tooltip text for blocking state
 */
export function getIndicatorTooltip(state: BlockingState): string {
  const parts: string[] = [];

  if (state.activeBlockedByIssues.length > 0) {
    parts.push(`Blocked by: ${state.activeBlockedByIssues.map((i) => i.key).join(', ')}`);
  }

  // Show resolved blockers separately
  const resolvedBlockers = state.blockedByIssues.filter(
    (i) => !state.activeBlockedByIssues.some((a) => a.key === i.key)
  );
  if (resolvedBlockers.length > 0) {
    parts.push(`Resolved blockers: ${resolvedBlockers.map((i) => i.key).join(', ')}`);
  }

  if (state.blockingIssues.length > 0) {
    parts.push(`Blocks: ${state.blockingIssues.map((i) => i.key).join(', ')}`);
  }

  return parts.join(' | ');
}
