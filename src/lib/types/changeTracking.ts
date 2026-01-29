/**
 * Change Tracking Types
 * Types for checkpoint-based change detection and activity indicators
 */

/**
 * Lightweight snapshot of an issue for comparison
 * Stores only essential data to minimize localStorage usage (~130 bytes per issue)
 */
export interface IssueSnapshot {
  key: string; // e.g., "PROJ-123"
  summary: string; // Issue title
  statusName: string; // e.g., "In Progress"
  statusCategoryKey: string; // 'new' | 'indeterminate' | 'done'
  updated: string; // ISO timestamp from issue.fields.updated
  commentCount: number; // Total comment count at checkpoint
  latestCommentId?: string; // ID of newest comment (for precise detection)
  assigneeId?: string; // Account ID (Cloud) or username (Server)
  assigneeName?: string; // Display name for UI
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
 * Basic issue info for change display
 */
export interface IssueChangeInfo {
  key: string;
  summary: string;
}

/**
 * A status change detected between checkpoint and current state
 */
export interface StatusChange extends IssueChangeInfo {
  previousStatus: string;
  previousCategoryKey: string;
  currentStatus: string;
  currentCategoryKey: string;
}

/**
 * A comment change detected between checkpoint and current state
 */
export interface CommentChange extends IssueChangeInfo {
  previousCount: number;
  currentCount: number;
  newCommentCount: number;
  latestAuthor?: string;
}

/**
 * An assignee change detected between checkpoint and current state
 */
export interface AssigneeChange extends IssueChangeInfo {
  previousAssignee?: string;
  currentAssignee?: string;
}

/**
 * Information about a removed issue (for display in change summary)
 */
export interface RemovedIssueInfo extends IssueChangeInfo {
  lastStatus: string;
}

/**
 * Detected changes between current state and checkpoint
 */
export interface ChangeDetection {
  newIssues: IssueChangeInfo[]; // Issues that are new
  removedIssues: RemovedIssueInfo[]; // Issues that were removed (with last known status)
  statusChanges: StatusChange[]; // Issues with status changes
  commentChanges: CommentChange[]; // Issues with new comments
  assigneeChanges: AssigneeChange[]; // Issues with assignee changes
  hasChanges: boolean; // Convenience flag
  checkpointTimestamp: string | null; // When last checkpoint was taken
}

/**
 * Activity period options for highlighting recently updated issues
 */
export type ActivityPeriod = '24h' | '7d' | 'off';

/**
 * Single change type for visual highlighting in UI
 */
export type SingleChangeType = 'new' | 'status-changed' | 'new-comments' | 'assignee-changed';

/**
 * Array of change types (or null for backwards compatibility)
 */
export type ChangeType = SingleChangeType | null;

/**
 * Multiple change types for an issue
 */
export type ChangeTypes = SingleChangeType[];

/**
 * Change types for a query (for sidebar indicators)
 */
export interface QueryChangeTypes {
  hasNew: boolean;
  hasRemoved: boolean;
  hasStatusChanges: boolean;
  hasCommentChanges: boolean;
  hasAssigneeChanges: boolean;
}

/**
 * State structure for the change tracking store
 */
export interface ChangeTrackingState {
  isEnabled: boolean; // Global toggle (default: false)
  activityPeriod: ActivityPeriod;
  checkpoints: CheckpointStore;
  currentChanges: ChangeDetection | null;
}
