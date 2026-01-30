/**
 * Change Tracking Store
 * Manages checkpoints and change detection for queries
 */

import type { JiraIssue } from '../types';
import type {
  IssueSnapshot,
  QueryCheckpoint,
  CheckpointStore,
  ChangeDetection,
  IssueChangeInfo,
  StatusChange,
  CommentChange,
  AssigneeChange,
  RemovedIssueInfo,
  ActivityPeriod,
  ChangeType,
  ChangeTypes,
  SingleChangeType,
  QueryChangeTypes
} from '../types/changeTracking';
import type { JiraComment } from '../types/jira';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container
export const changeTrackingState = $state({
  isEnabled: false,
  activityPeriod: '24h' as ActivityPeriod,
  showIndicators: true,
  checkpoints: {} as CheckpointStore,
  currentChanges: null as ChangeDetection | null,
  queriesWithPendingChanges: {} as Record<string, QueryChangeTypes>
});

// Cached change lookup map for O(1) access (pattern from keyboardNavigation.svelte.ts)
let cachedChangeLookup: Map<string, ChangeTypes> | null = null;
let cachedChangesRef: ChangeDetection | null = null;

/**
 * Invalidate the change lookup cache
 * Called when currentChanges is updated
 */
function invalidateChangeLookupCache(): void {
  cachedChangeLookup = null;
  cachedChangesRef = null;
}

/**
 * Build or return cached change type lookup map
 * Avoids O(n*m) lookups by pre-computing a Map in O(c) time
 */
function getChangeLookupMap(): Map<string, ChangeTypes> {
  const changes = changeTrackingState.currentChanges;

  // Return cached map if changes reference hasn't changed
  if (cachedChangesRef === changes && cachedChangeLookup !== null) {
    return cachedChangeLookup;
  }

  // Build new lookup map
  const lookup = new Map<string, ChangeTypes>();

  if (changes) {
    const sources: [IssueChangeInfo[], SingleChangeType][] = [
      [changes.newIssues, 'new'],
      [changes.statusChanges, 'status-changed'],
      [changes.commentChanges, 'new-comments'],
      [changes.assigneeChanges, 'assignee-changed']
    ];

    for (const [items, changeType] of sources) {
      for (const c of items) {
        const existing = lookup.get(c.key);
        if (existing) {
          existing.push(changeType);
        } else {
          lookup.set(c.key, [changeType]);
        }
      }
    }
  }

  // Cache the map and reference
  cachedChangeLookup = lookup;
  cachedChangesRef = changes;

  return lookup;
}

/**
 * Activity period options for UI
 */
export const ACTIVITY_PERIOD_OPTIONS: { value: ActivityPeriod; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: 'off', label: 'Off' }
];

/**
 * Initialize change tracking from storage
 */
export async function initializeChangeTracking(): Promise<void> {
  const [
    storedEnabled,
    storedPeriod,
    storedCheckpoints,
    storedPendingChanges,
    storedShowIndicators
  ] = await Promise.all([
    getStorageItemAsync<boolean>(STORAGE_KEYS.CHANGE_TRACKING_ENABLED),
    getStorageItemAsync<ActivityPeriod>(STORAGE_KEYS.CHANGE_TRACKING_ACTIVITY_PERIOD),
    getStorageItemAsync<CheckpointStore>(STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS),
    // Handle both old (boolean) and new (QueryChangeTypes) formats
    getStorageItemAsync<Record<string, boolean | QueryChangeTypes>>(
      STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES
    ),
    getStorageItemAsync<boolean>(STORAGE_KEYS.CHANGE_TRACKING_SHOW_INDICATORS)
  ]);

  if (storedEnabled !== null) {
    changeTrackingState.isEnabled = storedEnabled;
  }

  if (storedPeriod && ['24h', '7d', 'off'].includes(storedPeriod)) {
    changeTrackingState.activityPeriod = storedPeriod;
  }

  if (storedShowIndicators !== null) {
    changeTrackingState.showIndicators = storedShowIndicators;
  }

  if (storedCheckpoints) {
    changeTrackingState.checkpoints = storedCheckpoints;
  }

  if (storedPendingChanges) {
    // Migrate old boolean format to new QueryChangeTypes format
    const migrated: Record<string, QueryChangeTypes> = {};
    for (const [queryId, value] of Object.entries(storedPendingChanges)) {
      if (typeof value === 'boolean') {
        // Old format: convert boolean to generic "has changes" indicator
        migrated[queryId] = {
          hasNew: true, // Assume changes exist but type unknown
          hasRemoved: false,
          hasStatusChanges: false,
          hasCommentChanges: false,
          hasAssigneeChanges: false
        };
      } else {
        // New format: use as-is
        migrated[queryId] = value;
      }
    }
    changeTrackingState.queriesWithPendingChanges = migrated;
  }

  logger.store('changeTracking', 'Initialized', {
    isEnabled: changeTrackingState.isEnabled,
    activityPeriod: changeTrackingState.activityPeriod,
    showIndicators: changeTrackingState.showIndicators,
    checkpointCount: Object.keys(changeTrackingState.checkpoints).length
  });
}

/**
 * Enable or disable change tracking
 */
export function setChangeTrackingEnabled(enabled: boolean): void {
  changeTrackingState.isEnabled = enabled;
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_ENABLED, enabled);

  if (!enabled) {
    // Clear current changes display when disabled
    changeTrackingState.currentChanges = null;
    invalidateChangeLookupCache();
  }

  logger.store('changeTracking', 'Enabled changed', { enabled });
}

/**
 * Set activity period
 */
export function setActivityPeriod(period: ActivityPeriod): void {
  changeTrackingState.activityPeriod = period;
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_ACTIVITY_PERIOD, period);
  logger.store('changeTracking', 'Activity period changed', { period });
}

/**
 * Set whether to show change indicators (queries and issues)
 */
export function setShowIndicators(show: boolean): void {
  changeTrackingState.showIndicators = show;
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_SHOW_INDICATORS, show);
  logger.store('changeTracking', 'Show indicators changed', { show });
}

/**
 * Extract comment field data from an issue
 */
function getCommentField(issue: JiraIssue): { total: number; comments: JiraComment[] } {
  const field = (issue.fields as Record<string, unknown>).comment as
    | { total?: number; comments?: JiraComment[] }
    | undefined;
  return {
    total: field?.total ?? 0,
    comments: field?.comments ?? []
  };
}

/**
 * Find the latest comment by numeric ID (higher ID = newer)
 */
function getLatestComment(comments: JiraComment[]): JiraComment | undefined {
  if (comments.length === 0) return undefined;
  return comments.reduce(
    (latest, c) => (Number(c.id) > Number(latest.id) ? c : latest),
    comments[0]
  );
}

/**
 * Get assignee ID (accountId for Cloud, name/key for Server)
 */
function getAssigneeId(issue: JiraIssue): string | undefined {
  const assignee = issue.fields.assignee;
  if (!assignee) return undefined;
  return assignee.accountId || assignee.name || assignee.key;
}

/**
 * Create a snapshot from a JiraIssue
 */
function createSnapshot(issue: JiraIssue): IssueSnapshot {
  const { total, comments } = getCommentField(issue);
  const latestComment = getLatestComment(comments);

  return {
    key: issue.key,
    summary: issue.fields.summary,
    statusName: issue.fields.status.name,
    statusCategoryKey: issue.fields.status.statusCategory?.key || 'new',
    updated: issue.fields.updated,
    commentCount: total,
    latestCommentId: latestComment?.id,
    assigneeId: getAssigneeId(issue),
    assigneeName: issue.fields.assignee?.displayName
  };
}

/**
 * Save a checkpoint for a query
 */
export function saveCheckpoint(queryId: string, issues: JiraIssue[]): void {
  if (!changeTrackingState.isEnabled) {
    return;
  }

  const checkpoint: QueryCheckpoint = {
    timestamp: new Date().toISOString(),
    issueCount: issues.length,
    issues: issues.map(createSnapshot)
  };

  changeTrackingState.checkpoints = {
    ...changeTrackingState.checkpoints,
    [queryId]: checkpoint
  };

  // Clear current changes after saving checkpoint (user acknowledged changes)
  changeTrackingState.currentChanges = null;
  invalidateChangeLookupCache();

  // Clear pending changes indicator for this query
  const { [queryId]: _pending, ...restPending } = changeTrackingState.queriesWithPendingChanges;
  changeTrackingState.queriesWithPendingChanges = restPending;
  persistPendingChanges();

  persistCheckpoints();
  logger.store('changeTracking', 'Checkpoint saved', {
    queryId,
    issueCount: issues.length
  });
}

/**
 * Check if a checkpoint exists for a query
 */
export function hasCheckpoint(queryId: string): boolean {
  return queryId in changeTrackingState.checkpoints;
}

/**
 * Detect changes between current issues and the stored checkpoint
 */
export function detectChanges(queryId: string, currentIssues: JiraIssue[]): ChangeDetection {
  // If tracking is disabled, return empty result
  if (!changeTrackingState.isEnabled) {
    return {
      newIssues: [],
      removedIssues: [],
      statusChanges: [],
      commentChanges: [],
      assigneeChanges: [],
      hasChanges: false,
      checkpointTimestamp: null
    };
  }

  const checkpoint = changeTrackingState.checkpoints[queryId];

  // No checkpoint exists yet - create one automatically
  if (!checkpoint) {
    saveCheckpoint(queryId, currentIssues);
    return {
      newIssues: [],
      removedIssues: [],
      statusChanges: [],
      commentChanges: [],
      assigneeChanges: [],
      hasChanges: false,
      checkpointTimestamp: new Date().toISOString()
    };
  }

  const previousMap = new Map(checkpoint.issues.map((s) => [s.key, s]));
  const currentMap = new Map(currentIssues.map((i) => [i.key, i]));

  // Find new issues (in current but not in checkpoint)
  const newIssues: IssueChangeInfo[] = [];
  for (const [key, issue] of currentMap) {
    if (!previousMap.has(key)) {
      newIssues.push({ key, summary: issue.fields.summary });
    }
  }

  // Find removed issues (in checkpoint but not in current)
  const removedIssues: RemovedIssueInfo[] = [];
  for (const [key, snapshot] of previousMap) {
    if (!currentMap.has(key)) {
      removedIssues.push({
        key,
        summary: snapshot.summary,
        lastStatus: snapshot.statusName
      });
    }
  }

  // Find status, comment, and assignee changes in a single pass
  const statusChanges: StatusChange[] = [];
  const commentChanges: CommentChange[] = [];
  const assigneeChanges: AssigneeChange[] = [];

  for (const [key, snapshot] of previousMap) {
    const currentIssue = currentMap.get(key);
    if (!currentIssue) continue; // Issue was removed, handled above

    const summary = currentIssue.fields.summary;

    // Status change?
    if (currentIssue.fields.status.name !== snapshot.statusName) {
      statusChanges.push({
        key,
        summary,
        previousStatus: snapshot.statusName,
        previousCategoryKey: snapshot.statusCategoryKey,
        currentStatus: currentIssue.fields.status.name,
        currentCategoryKey: currentIssue.fields.status.statusCategory?.key || 'new'
      });
    }

    // Comment change?
    const { total: currentCount, comments } = getCommentField(currentIssue);
    const previousCount = snapshot.commentCount ?? 0;
    const latestComment = getLatestComment(comments);
    const hasNewComments =
      currentCount > previousCount ||
      (latestComment && snapshot.latestCommentId && latestComment.id !== snapshot.latestCommentId);

    if (hasNewComments) {
      commentChanges.push({
        key,
        summary,
        previousCount,
        currentCount,
        newCommentCount: Math.max(0, currentCount - previousCount),
        latestAuthor: latestComment?.author?.displayName
      });
    }

    // Assignee change?
    const currentAssigneeId = getAssigneeId(currentIssue);
    if (currentAssigneeId !== snapshot.assigneeId) {
      assigneeChanges.push({
        key,
        summary,
        previousAssignee: snapshot.assigneeName,
        currentAssignee: currentIssue.fields.assignee?.displayName
      });
    }
  }

  const changes: ChangeDetection = {
    newIssues,
    removedIssues,
    statusChanges,
    commentChanges,
    assigneeChanges,
    hasChanges:
      newIssues.length > 0 ||
      removedIssues.length > 0 ||
      statusChanges.length > 0 ||
      commentChanges.length > 0 ||
      assigneeChanges.length > 0,
    checkpointTimestamp: checkpoint.timestamp
  };

  changeTrackingState.currentChanges = changes;
  invalidateChangeLookupCache();

  // Track pending changes for query list indicator (with change types)
  if (changes.hasChanges) {
    const queryChangeTypes: QueryChangeTypes = {
      hasNew: changes.newIssues.length > 0,
      hasRemoved: changes.removedIssues.length > 0,
      hasStatusChanges: changes.statusChanges.length > 0,
      hasCommentChanges: changes.commentChanges.length > 0,
      hasAssigneeChanges: changes.assigneeChanges.length > 0
    };
    changeTrackingState.queriesWithPendingChanges = {
      ...changeTrackingState.queriesWithPendingChanges,
      [queryId]: queryChangeTypes
    };
    persistPendingChanges();
  }

  return changes;
}

/**
 * Check if an issue was recently updated based on activity period
 */
export function isRecentlyUpdated(
  issue: JiraIssue,
  period: ActivityPeriod = changeTrackingState.activityPeriod
): boolean {
  if (period === 'off' || !changeTrackingState.isEnabled) return false;

  const updatedDate = new Date(issue.fields.updated);
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();

  const thresholds: Record<ActivityPeriod, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    off: Infinity
  };

  return diffMs <= thresholds[period];
}

/**
 * Get all change types for an issue (for displaying multiple indicators)
 * Uses cached Map for O(1) lookup instead of O(4c) array iterations
 */
export function getIssueChangeTypes(issueKey: string): ChangeTypes {
  if (!changeTrackingState.isEnabled || !changeTrackingState.currentChanges) return [];
  return getChangeLookupMap().get(issueKey) || [];
}

/**
 * Get change type for an issue (for visual highlighting)
 * Returns only the first/primary change type
 */
export function getIssueChangeType(issueKey: string): ChangeType {
  const types = getIssueChangeTypes(issueKey);
  return types.length > 0 ? types[0] : null;
}

/**
 * Clear checkpoint for a query
 */
export function clearCheckpoint(queryId: string): void {
  const { [queryId]: _checkpoint, ...restCheckpoints } = changeTrackingState.checkpoints;
  const { [queryId]: _pending, ...restPending } = changeTrackingState.queriesWithPendingChanges;
  changeTrackingState.checkpoints = restCheckpoints;
  changeTrackingState.queriesWithPendingChanges = restPending;
  persistCheckpoints();
  persistPendingChanges();
  logger.store('changeTracking', 'Checkpoint cleared', { queryId });
}

/**
 * Clear all checkpoints
 */
export function clearAllCheckpoints(): void {
  changeTrackingState.checkpoints = {};
  changeTrackingState.queriesWithPendingChanges = {};
  changeTrackingState.currentChanges = null;
  invalidateChangeLookupCache();
  persistCheckpoints();
  persistPendingChanges();
  logger.store('changeTracking', 'All checkpoints cleared');
}

/**
 * Persist checkpoints to storage
 */
function persistCheckpoints(): void {
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS, changeTrackingState.checkpoints);
}

/**
 * Persist pending changes to storage
 */
function persistPendingChanges(): void {
  saveStorage(
    STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES,
    changeTrackingState.queriesWithPendingChanges
  );
}

/**
 * Check if a query has unacknowledged changes (for query list indicator)
 */
export function hasUnacknowledgedChanges(queryId: string): boolean {
  if (!changeTrackingState.isEnabled) return false;
  return queryId in changeTrackingState.queriesWithPendingChanges;
}

/**
 * Get the change types for a query (for colored indicators in sidebar)
 */
export function getQueryChangeTypes(queryId: string): QueryChangeTypes | null {
  if (!changeTrackingState.isEnabled) return null;
  return changeTrackingState.queriesWithPendingChanges[queryId] ?? null;
}

/**
 * Get formatted time since checkpoint
 */
export function getTimeSinceCheckpoint(queryId: string): string | null {
  const checkpoint = changeTrackingState.checkpoints[queryId];
  if (!checkpoint) return null;

  const checkpointDate = new Date(checkpoint.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - checkpointDate.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Get checkpoint timestamp for a query
 */
export function getCheckpointTimestamp(queryId: string): string | null {
  return changeTrackingState.checkpoints[queryId]?.timestamp || null;
}

/**
 * Clean up orphaned checkpoints (checkpoints for queries that no longer exist)
 * @param validQueryIds - Set of valid query IDs (from jql store)
 * @returns Number of orphaned checkpoints removed
 */
export function cleanupOrphanedCheckpoints(validQueryIds: Set<string>): number {
  const checkpointQueryIds = Object.keys(changeTrackingState.checkpoints);

  let removed = 0;
  const cleanedCheckpoints: CheckpointStore = {};

  for (const queryId of checkpointQueryIds) {
    if (validQueryIds.has(queryId)) {
      cleanedCheckpoints[queryId] = changeTrackingState.checkpoints[queryId];
    } else {
      removed++;
      logger.store('changeTracking', 'Removed orphaned checkpoint', { queryId });
    }
  }

  if (removed > 0) {
    changeTrackingState.checkpoints = cleanedCheckpoints;

    // Also clean pending changes
    const cleanedPending: Record<string, QueryChangeTypes> = {};
    for (const queryId of Object.keys(changeTrackingState.queriesWithPendingChanges)) {
      if (validQueryIds.has(queryId)) {
        cleanedPending[queryId] = changeTrackingState.queriesWithPendingChanges[queryId];
      }
    }
    changeTrackingState.queriesWithPendingChanges = cleanedPending;

    persistCheckpoints();
    persistPendingChanges();
  }

  return removed;
}

/**
 * Clean up stale checkpoints older than specified days
 * @param maxAgeDays - Maximum age in days (default: 30)
 * @returns Number of stale checkpoints removed
 */
export function cleanupStaleCheckpoints(maxAgeDays: number = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const cutoffMs = cutoffDate.getTime();

  let removed = 0;
  const cleanedCheckpoints: CheckpointStore = {};

  for (const [queryId, checkpoint] of Object.entries(changeTrackingState.checkpoints)) {
    const checkpointTime = new Date(checkpoint.timestamp).getTime();
    if (checkpointTime >= cutoffMs) {
      cleanedCheckpoints[queryId] = checkpoint;
    } else {
      removed++;
      const ageDays = Math.round((Date.now() - checkpointTime) / (1000 * 60 * 60 * 24));
      logger.store('changeTracking', 'Removed stale checkpoint', { queryId, ageDays });
    }
  }

  if (removed > 0) {
    changeTrackingState.checkpoints = cleanedCheckpoints;
    persistCheckpoints();
  }

  return removed;
}

/**
 * Run all cleanup routines
 * @param validQueryIds - Set of valid query IDs (from jql store)
 * @returns Summary of cleanup actions
 */
export function runCheckpointCleanup(validQueryIds: Set<string>): {
  orphaned: number;
  stale: number;
} {
  const orphaned = cleanupOrphanedCheckpoints(validQueryIds);
  const stale = cleanupStaleCheckpoints();

  if (orphaned > 0 || stale > 0) {
    logger.store('changeTracking', 'Cleanup completed', { orphaned, stale });
  }

  return { orphaned, stale };
}
