/**
 * Change Tracking Types
 * Types for checkpoint-based change detection and activity indicators
 */

/**
 * Lightweight snapshot of an issue for comparison
 * Stores only essential data to minimize localStorage usage (~100 bytes per issue)
 */
export interface IssueSnapshot {
  key: string; // e.g., "PROJ-123"
  statusName: string; // e.g., "In Progress"
  statusCategoryKey: string; // 'new' | 'indeterminate' | 'done'
  updated: string; // ISO timestamp from issue.fields.updated
}

/**
 * A checkpoint represents the state of a query at a point in time
 */
export interface QueryCheckpoint {
  timestamp: string; // ISO timestamp when checkpoint was created
  issueCount: number; // Total number of issues
  issues: IssueSnapshot[]; // Minimal snapshots
}

/**
 * Storage structure for all checkpoints (keyed by query ID)
 */
export interface CheckpointStore {
  [queryId: string]: QueryCheckpoint;
}

/**
 * A status change detected between checkpoint and current state
 */
export interface StatusChange {
  key: string;
  previousStatus: string;
  previousCategoryKey: string;
  currentStatus: string;
  currentCategoryKey: string;
}

/**
 * Information about a removed issue (for display in change summary)
 */
export interface RemovedIssueInfo {
  key: string;
  lastStatus: string;
}

/**
 * Detected changes between current state and checkpoint
 */
export interface ChangeDetection {
  newIssues: string[]; // Issue keys that are new
  removedIssues: RemovedIssueInfo[]; // Issues that were removed (with last known status)
  statusChanges: StatusChange[]; // Issues with status changes
  hasChanges: boolean; // Convenience flag
  checkpointTimestamp: string | null; // When last checkpoint was taken
}

/**
 * Activity period options for highlighting recently updated issues
 */
export type ActivityPeriod = '24h' | '7d' | 'off';

/**
 * Change type for visual highlighting in UI
 */
export type ChangeType = 'new' | 'status-changed' | null;

/**
 * State structure for the change tracking store
 */
export interface ChangeTrackingState {
  isEnabled: boolean; // Global toggle (default: false)
  activityPeriod: ActivityPeriod;
  checkpoints: CheckpointStore;
  currentChanges: ChangeDetection | null;
}
