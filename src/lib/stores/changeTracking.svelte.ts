/**
 * Change Tracking Store
 * Manages checkpoints and change detection for queries
 */

import type { JiraIssue, JiraUser } from '../types';
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
  QueryChangeTypes,
  OwnChangeCache
} from '../types/changeTracking';
import type { JiraComment } from '../types/jira';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';
import { debugModeState } from './debugMode.svelte';

// Stale checkpoint alert threshold type
export type StaleCheckpointDays = 'off' | 1 | 3 | 5 | 7;

// State container
export const changeTrackingState = $state({
  isEnabled: false,
  activityPeriod: '24h' as ActivityPeriod,
  showIndicators: true,
  checkpoints: {} as CheckpointStore,
  currentChanges: null as ChangeDetection | null,
  queriesWithPendingChanges: {} as Record<string, QueryChangeTypes>,
  // Beta: Exclude own changes feature
  excludeOwnChanges: false,
  ownChangeCache: {} as OwnChangeCache,
  isFilteringOwnChanges: false,
  // Debug: Filtered own changes (only populated when debug mode is enabled)
  filteredOwnChangesDebug: null as FilteredOwnChangesDebug | null,
  // Stale checkpoint alert: highlight Check button when checkpoint is older than X days
  staleCheckpointDays: 3 as StaleCheckpointDays
});

/**
 * Debug info for filtered own changes
 */
export interface FilteredOwnChangesDebug {
  timestamp: string;
  filteredNewIssues: IssueChangeInfo[];
  filteredStatusChanges: StatusChange[];
  filteredCommentChanges: CommentChange[];
  filteredAssigneeChanges: AssigneeChange[];
  totalFiltered: number;
}

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
 * Stale checkpoint days options for UI
 */
export const STALE_CHECKPOINT_OPTIONS: { value: StaleCheckpointDays; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 5, label: '5 days' },
  { value: 7, label: '7 days' }
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
    storedShowIndicators,
    storedExcludeOwn,
    storedOwnCache,
    storedStaleDays
  ] = await Promise.all([
    getStorageItemAsync<boolean>(STORAGE_KEYS.CHANGE_TRACKING_ENABLED),
    getStorageItemAsync<ActivityPeriod>(STORAGE_KEYS.CHANGE_TRACKING_ACTIVITY_PERIOD),
    getStorageItemAsync<CheckpointStore>(STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS),
    // Handle both old (boolean) and new (QueryChangeTypes) formats
    getStorageItemAsync<Record<string, boolean | QueryChangeTypes>>(
      STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES
    ),
    getStorageItemAsync<boolean>(STORAGE_KEYS.CHANGE_TRACKING_SHOW_INDICATORS),
    getStorageItemAsync<boolean>(STORAGE_KEYS.CHANGE_TRACKING_EXCLUDE_OWN),
    getStorageItemAsync<OwnChangeCache>(STORAGE_KEYS.CHANGE_TRACKING_OWN_CACHE),
    getStorageItemAsync<StaleCheckpointDays>(STORAGE_KEYS.CHANGE_TRACKING_STALE_DAYS)
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

  // Beta: Exclude own changes feature
  if (storedExcludeOwn !== null) {
    changeTrackingState.excludeOwnChanges = storedExcludeOwn;
  }

  if (storedOwnCache) {
    changeTrackingState.ownChangeCache = storedOwnCache;
  }

  if (storedStaleDays !== null) {
    changeTrackingState.staleCheckpointDays = storedStaleDays;
  }

  logger.store('changeTracking', 'Initialized', {
    isEnabled: changeTrackingState.isEnabled,
    activityPeriod: changeTrackingState.activityPeriod,
    showIndicators: changeTrackingState.showIndicators,
    excludeOwnChanges: changeTrackingState.excludeOwnChanges,
    staleCheckpointDays: changeTrackingState.staleCheckpointDays,
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
 * Set whether to exclude own changes (Beta feature)
 */
export function setExcludeOwnChanges(enabled: boolean): void {
  changeTrackingState.excludeOwnChanges = enabled;
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_EXCLUDE_OWN, enabled);

  if (!enabled) {
    // Clear cache when disabled to free memory
    changeTrackingState.ownChangeCache = {};
    saveStorage(STORAGE_KEYS.CHANGE_TRACKING_OWN_CACHE, {});
  }

  logger.store('changeTracking', 'Exclude own changes changed', { enabled });
}

/**
 * Set stale checkpoint alert threshold (days)
 */
export function setStaleCheckpointDays(days: StaleCheckpointDays): void {
  changeTrackingState.staleCheckpointDays = days;
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_STALE_DAYS, days);
  logger.store('changeTracking', 'Stale checkpoint days changed', { days });
}

/**
 * Check if a checkpoint is stale (older than configured threshold)
 */
export function isCheckpointStale(queryId: string): boolean {
  if (
    !changeTrackingState.isEnabled ||
    changeTrackingState.staleCheckpointDays === 'off'
  ) {
    return false;
  }

  const checkpoint = changeTrackingState.checkpoints[queryId];
  if (!checkpoint) return false;

  const checkpointDate = new Date(checkpoint.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - checkpointDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= changeTrackingState.staleCheckpointDays;
}

/**
 * Get user identifier from JiraUser (accountId for Cloud, name/key for Server)
 */
export function getUserIdentifier(user: JiraUser | null | undefined): string | null {
  if (!user) return null;
  return user.accountId || user.name || user.key || null;
}

/**
 * Clear the own change cache (e.g., on disconnect)
 */
export function clearOwnChangeCache(): void {
  changeTrackingState.ownChangeCache = {};
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_OWN_CACHE, {});
  logger.store('changeTracking', 'Own change cache cleared');
}

/**
 * Persist own change cache to storage
 */
function persistOwnChangeCache(): void {
  saveStorage(STORAGE_KEYS.CHANGE_TRACKING_OWN_CACHE, changeTrackingState.ownChangeCache);
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

  // Clear own change cache for these issues (baseline has changed)
  if (Object.keys(changeTrackingState.ownChangeCache).length > 0) {
    const issueKeys = new Set(issues.map((i) => i.key));
    let cacheCleared = 0;
    const newCache = { ...changeTrackingState.ownChangeCache };
    for (const key of Object.keys(newCache)) {
      if (issueKeys.has(key)) {
        delete newCache[key];
        cacheCleared++;
      }
    }
    if (cacheCleared > 0) {
      changeTrackingState.ownChangeCache = newCache;
      persistOwnChangeCache();
      logger.store('changeTracking', 'Cleared own change cache entries', { count: cacheCleared });
    }
  }

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
 * Filter interface for getting issue changelog
 */
export interface ChangelogFetcher {
  getIssueWithChangelog(issueKey: string): Promise<{
    changelog?: {
      histories: Array<{
        id: string;
        author: JiraUser;
        created: string;
        items: Array<{ field: string }>;
      }>;
    };
  }>;
}

/**
 * Filter own changes from detection result (Beta feature)
 * Removes changes that were made by the current user
 *
 * @param changes - The detected changes from detectChanges()
 * @param currentUserId - The current user's identifier (accountId or name/key)
 * @param currentIssues - The current issues (for comment author lookup)
 * @param fetcher - Object with getIssueWithChangelog method for status/assignee checks
 * @returns Filtered ChangeDetection with own changes removed
 */
export async function filterOwnChanges(
  changes: ChangeDetection,
  currentUserId: string,
  currentIssues: JiraIssue[],
  fetcher: ChangelogFetcher
): Promise<ChangeDetection> {
  if (!changeTrackingState.excludeOwnChanges || !changes.hasChanges) {
    return changes;
  }

  changeTrackingState.isFilteringOwnChanges = true;

  try {
    const issueMap = new Map(currentIssues.map((i) => [i.key, i]));

    // Track filtered changes for debug mode
    const ownCommentChanges: CommentChange[] = [];
    const ownNewIssues: IssueChangeInfo[] = [];
    const ownStatusChanges: StatusChange[] = [];
    const ownAssigneeChanges: AssigneeChange[] = [];

    // Filter comment changes (no API call needed - author is in the issue)
    const filteredCommentChanges = changes.commentChanges.filter((change) => {
      const issue = issueMap.get(change.key);
      if (!issue) return true; // Keep if issue not found

      const { comments } = getCommentField(issue);
      const latestComment = getLatestComment(comments);
      if (!latestComment) return true; // Keep if no comment found

      const authorId = getUserIdentifier(latestComment.author);
      const isOwn = authorId === currentUserId;

      if (isOwn) {
        ownCommentChanges.push(change);
      }

      return !isOwn;
    });

    // Filter new issues (check reporter)
    const filteredNewIssues = changes.newIssues.filter((change) => {
      const issue = issueMap.get(change.key);
      if (!issue) return true;

      const reporterId = getUserIdentifier(issue.fields.reporter);
      const isOwn = reporterId === currentUserId;

      if (isOwn) {
        ownNewIssues.push(change);
      }

      return !isOwn;
    });

    // Filter status and assignee changes (need changelog API)
    const filteredStatusChanges: StatusChange[] = [];
    const filteredAssigneeChanges: AssigneeChange[] = [];

    // Helper to find the most recent changelog entry that changed a specific field
    function findChangeAuthor(
      histories: Array<{
        id: string;
        author: JiraUser;
        created: string;
        items: Array<{ field: string }>;
      }>,
      fieldName: string,
      issueKey: string
    ): string | null {
      for (const history of histories) {
        const matchingItem = history.items.find(
          (item) => item.field.toLowerCase() === fieldName.toLowerCase()
        );
        if (matchingItem) {
          const authorId = getUserIdentifier(history.author);
          if (debugModeState.enabled) {
            logger.info(
              `🔍 [${issueKey}] Found "${fieldName}" change by: ${history.author?.displayName} (${authorId})`
            );
          }
          return authorId;
        }
      }
      if (debugModeState.enabled) {
        // Log what fields were found instead
        const allFields = histories.flatMap((h) => h.items.map((i) => i.field));
        logger.info(
          `🔍 [${issueKey}] No "${fieldName}" found in changelog. Available fields: ${[...new Set(allFields)].join(', ')}`
        );
      }
      return null;
    }

    // Collect all unique keys that need changelog check
    const keysNeedingChangelog = new Set<string>();
    for (const change of changes.statusChanges) {
      keysNeedingChangelog.add(change.key);
    }
    for (const change of changes.assigneeChanges) {
      keysNeedingChangelog.add(change.key);
    }

    if (debugModeState.enabled && keysNeedingChangelog.size > 0) {
      logger.info(
        `🔍 Fetching changelogs for ${keysNeedingChangelog.size} issues to check own changes...`
      );
      logger.info(`🔍 Current user ID: ${currentUserId}`);
    }

    // Fetch changelogs and store authors per field type
    const statusAuthors = new Map<string, string | null>();
    const assigneeAuthors = new Map<string, string | null>();

    for (const key of keysNeedingChangelog) {
      try {
        // Small delay to avoid rate limiting
        if (statusAuthors.size > 0 || assigneeAuthors.size > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const issueWithChangelog = await fetcher.getIssueWithChangelog(key);
        const histories = issueWithChangelog.changelog?.histories ?? [];

        if (debugModeState.enabled) {
          logger.info(`🔍 [${key}] Changelog has ${histories.length} entries`);
        }

        // Find author of status change (if any)
        if (changes.statusChanges.some((c) => c.key === key)) {
          statusAuthors.set(key, findChangeAuthor(histories, 'status', key));
        }

        // Find author of assignee change (if any)
        if (changes.assigneeChanges.some((c) => c.key === key)) {
          assigneeAuthors.set(key, findChangeAuthor(histories, 'assignee', key));
        }
      } catch (error) {
        // Fail-open: keep the change if we can't check
        logger.warn(`Failed to fetch changelog for ${key}`, error);
        statusAuthors.set(key, null);
        assigneeAuthors.set(key, null);
      }
    }

    // Filter status changes based on who made the status change
    for (const change of changes.statusChanges) {
      const authorId = statusAuthors.get(change.key);
      const isOwn = authorId === currentUserId;

      if (debugModeState.enabled) {
        logger.info(
          `🔍 [${change.key}] Status change author: ${authorId}, currentUser: ${currentUserId}, isOwn: ${isOwn}`
        );
      }

      if (isOwn) {
        ownStatusChanges.push(change);
      } else {
        filteredStatusChanges.push(change);
      }
    }

    // Filter assignee changes based on who made the assignee change
    for (const change of changes.assigneeChanges) {
      const authorId = assigneeAuthors.get(change.key);
      const isOwn = authorId === currentUserId;

      if (debugModeState.enabled) {
        logger.info(
          `🔍 [${change.key}] Assignee change author: ${authorId}, currentUser: ${currentUserId}, isOwn: ${isOwn}`
        );
      }

      if (isOwn) {
        ownAssigneeChanges.push(change);
      } else {
        filteredAssigneeChanges.push(change);
      }
    }

    // Build filtered result
    const filteredChanges: ChangeDetection = {
      newIssues: filteredNewIssues,
      removedIssues: changes.removedIssues, // Can't filter - no author info
      statusChanges: filteredStatusChanges,
      commentChanges: filteredCommentChanges,
      assigneeChanges: filteredAssigneeChanges,
      hasChanges:
        filteredNewIssues.length > 0 ||
        changes.removedIssues.length > 0 ||
        filteredStatusChanges.length > 0 ||
        filteredCommentChanges.length > 0 ||
        filteredAssigneeChanges.length > 0,
      checkpointTimestamp: changes.checkpointTimestamp
    };

    // Update state with filtered changes
    changeTrackingState.currentChanges = filteredChanges;
    invalidateChangeLookupCache();

    const totalFiltered =
      ownNewIssues.length +
      ownStatusChanges.length +
      ownCommentChanges.length +
      ownAssigneeChanges.length;

    // Store debug info if debug mode is enabled
    if (totalFiltered > 0) {
      if (debugModeState.enabled) {
        changeTrackingState.filteredOwnChangesDebug = {
          timestamp: new Date().toISOString(),
          filteredNewIssues: ownNewIssues,
          filteredStatusChanges: ownStatusChanges,
          filteredCommentChanges: ownCommentChanges,
          filteredAssigneeChanges: ownAssigneeChanges,
          totalFiltered
        };

        // Detailed logging in debug mode
        logger.info('🔍 Filtered own changes (debug):', {
          total: totalFiltered,
          newIssues: ownNewIssues.map((i) => i.key),
          statusChanges: ownStatusChanges.map(
            (i) => `${i.key}: ${i.previousStatus} → ${i.currentStatus}`
          ),
          commentChanges: ownCommentChanges.map((i) => i.key),
          assigneeChanges: ownAssigneeChanges.map(
            (i) => `${i.key}: ${i.previousAssignee ?? 'none'} → ${i.currentAssignee ?? 'none'}`
          )
        });
      } else {
        // Clear debug info when not in debug mode
        changeTrackingState.filteredOwnChangesDebug = null;
      }

      logger.store('changeTracking', 'Filtered own changes', {
        newIssues: ownNewIssues.length,
        statusChanges: ownStatusChanges.length,
        commentChanges: ownCommentChanges.length,
        assigneeChanges: ownAssigneeChanges.length
      });
    } else {
      changeTrackingState.filteredOwnChangesDebug = null;
    }

    return filteredChanges;
  } finally {
    changeTrackingState.isFilteringOwnChanges = false;
  }
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
