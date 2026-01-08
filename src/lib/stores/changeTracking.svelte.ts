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
  StatusChange,
  RemovedIssueInfo,
  ActivityPeriod,
  ChangeType
} from '../types/changeTracking';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container
export const changeTrackingState = $state({
  isEnabled: false,
  activityPeriod: '24h' as ActivityPeriod,
  checkpoints: {} as CheckpointStore,
  currentChanges: null as ChangeDetection | null,
  queriesWithPendingChanges: {} as Record<string, boolean>
});

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
export function initializeChangeTracking(): void {
  const storedEnabled = getStorageItem<boolean>(STORAGE_KEYS.CHANGE_TRACKING_ENABLED);
  if (storedEnabled !== null) {
    changeTrackingState.isEnabled = storedEnabled;
  }

  const storedPeriod = getStorageItem<ActivityPeriod>(STORAGE_KEYS.CHANGE_TRACKING_ACTIVITY_PERIOD);
  if (storedPeriod && ['24h', '7d', 'off'].includes(storedPeriod)) {
    changeTrackingState.activityPeriod = storedPeriod;
  }

  const storedCheckpoints = getStorageItem<CheckpointStore>(
    STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS
  );
  if (storedCheckpoints) {
    changeTrackingState.checkpoints = storedCheckpoints;
  }

  const storedPendingChanges = getStorageItem<Record<string, boolean>>(
    STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES
  );
  if (storedPendingChanges) {
    changeTrackingState.queriesWithPendingChanges = storedPendingChanges;
  }

  logger.store('changeTracking', 'Initialized', {
    isEnabled: changeTrackingState.isEnabled,
    activityPeriod: changeTrackingState.activityPeriod,
    checkpointCount: Object.keys(changeTrackingState.checkpoints).length
  });
}

/**
 * Enable or disable change tracking
 */
export function setChangeTrackingEnabled(enabled: boolean): void {
  changeTrackingState.isEnabled = enabled;
  setStorageItem(STORAGE_KEYS.CHANGE_TRACKING_ENABLED, enabled);

  if (!enabled) {
    // Clear current changes display when disabled
    changeTrackingState.currentChanges = null;
  }

  logger.store('changeTracking', 'Enabled changed', { enabled });
}

/**
 * Set activity period
 */
export function setActivityPeriod(period: ActivityPeriod): void {
  changeTrackingState.activityPeriod = period;
  setStorageItem(STORAGE_KEYS.CHANGE_TRACKING_ACTIVITY_PERIOD, period);
  logger.store('changeTracking', 'Activity period changed', { period });
}

/**
 * Create a snapshot from a JiraIssue
 */
function createSnapshot(issue: JiraIssue): IssueSnapshot {
  return {
    key: issue.key,
    statusName: issue.fields.status.name,
    statusCategoryKey: issue.fields.status.statusCategory?.key || 'new',
    updated: issue.fields.updated
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
      hasChanges: false,
      checkpointTimestamp: new Date().toISOString()
    };
  }

  const previousMap = new Map(checkpoint.issues.map((s) => [s.key, s]));
  const currentMap = new Map(currentIssues.map((i) => [i.key, i]));

  // Find new issues (in current but not in checkpoint)
  const newIssues: string[] = [];
  for (const key of currentMap.keys()) {
    if (!previousMap.has(key)) {
      newIssues.push(key);
    }
  }

  // Find removed issues (in checkpoint but not in current)
  const removedIssues: RemovedIssueInfo[] = [];
  for (const [key, snapshot] of previousMap) {
    if (!currentMap.has(key)) {
      removedIssues.push({
        key,
        lastStatus: snapshot.statusName
      });
    }
  }

  // Find status changes
  const statusChanges: StatusChange[] = [];
  for (const [key, snapshot] of previousMap) {
    const currentIssue = currentMap.get(key);
    if (currentIssue && currentIssue.fields.status.name !== snapshot.statusName) {
      statusChanges.push({
        key,
        previousStatus: snapshot.statusName,
        previousCategoryKey: snapshot.statusCategoryKey,
        currentStatus: currentIssue.fields.status.name,
        currentCategoryKey: currentIssue.fields.status.statusCategory?.key || 'new'
      });
    }
  }

  const changes: ChangeDetection = {
    newIssues,
    removedIssues,
    statusChanges,
    hasChanges: newIssues.length > 0 || removedIssues.length > 0 || statusChanges.length > 0,
    checkpointTimestamp: checkpoint.timestamp
  };

  changeTrackingState.currentChanges = changes;

  // Track pending changes for query list indicator
  if (changes.hasChanges) {
    changeTrackingState.queriesWithPendingChanges = {
      ...changeTrackingState.queriesWithPendingChanges,
      [queryId]: true
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
 * Get change type for an issue (for visual highlighting)
 */
export function getIssueChangeType(issueKey: string): ChangeType {
  if (!changeTrackingState.isEnabled) return null;

  const changes = changeTrackingState.currentChanges;
  if (!changes) return null;

  if (changes.newIssues.includes(issueKey)) return 'new';
  if (changes.statusChanges.some((c) => c.key === issueKey)) return 'status-changed';
  return null;
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
  persistCheckpoints();
  persistPendingChanges();
  logger.store('changeTracking', 'All checkpoints cleared');
}

/**
 * Persist checkpoints to storage
 */
function persistCheckpoints(): void {
  setStorageItem(STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS, changeTrackingState.checkpoints);
}

/**
 * Persist pending changes to storage
 */
function persistPendingChanges(): void {
  setStorageItem(
    STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES,
    changeTrackingState.queriesWithPendingChanges
  );
}

/**
 * Check if a query has unacknowledged changes (for query list indicator)
 */
export function hasUnacknowledgedChanges(queryId: string): boolean {
  if (!changeTrackingState.isEnabled) return false;
  return changeTrackingState.queriesWithPendingChanges[queryId] === true;
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
