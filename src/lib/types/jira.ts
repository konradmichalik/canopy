/**
 * JIRA API Type Definitions
 * Supports both JIRA Cloud (API v3) and Server/Data Center (API v2)
 */

// ============================================
// Core Issue Types
// ============================================

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraIssueFields {
  summary: string;
  description?: string | AdfDocument | null;
  status: JiraStatus;
  issuetype: JiraIssueType;
  priority?: JiraPriority | null;
  assignee?: JiraUser | null;
  reporter?: JiraUser | null;
  created: string;
  updated: string;
  resolutiondate?: string | null;
  resolution?: JiraResolution | null;

  // Hierarchy fields
  parent?: JiraParentRef | null;
  subtasks?: JiraSubtaskRef[];

  // Epic-specific (differs between Cloud and Server)
  // Cloud: uses parent field
  // Server: uses customfield_XXXXX (Epic Link)
  [key: string]: unknown;

  // Progress tracking
  progress?: JiraProgress;
  aggregateprogress?: JiraProgress;

  // Issue links
  issuelinks?: JiraIssueLink[];

  // Project info
  project: JiraProject;

  // Labels and components
  labels?: string[];
  components?: JiraComponent[];
}

export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  statusCategory: JiraStatusCategory;
}

export interface JiraStatusCategory {
  id: number;
  key: 'new' | 'indeterminate' | 'done' | string;
  colorName: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
  iconUrl: string;
  hierarchyLevel?: number; // Cloud: -1=Subtask, 0=Standard, 1=Epic
}

export interface JiraUser {
  // Cloud uses accountId, Server uses name/key
  accountId?: string;
  name?: string;
  key?: string;
  emailAddress?: string;
  displayName: string;
  avatarUrls: JiraAvatarUrls;
  active: boolean;
}

export interface JiraAvatarUrls {
  '48x48': string;
  '24x24': string;
  '16x16': string;
  '32x32': string;
}

export interface JiraParentRef {
  id: string;
  key: string;
  fields?: {
    summary: string;
    status?: JiraStatus;
    issuetype?: JiraIssueType;
  };
}

export interface JiraSubtaskRef {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: JiraStatus;
    issuetype: JiraIssueType;
  };
}

export interface JiraProgress {
  progress: number;
  total: number;
  percent?: number;
}

export interface JiraIssueLink {
  id: string;
  type: JiraIssueLinkType;
  inwardIssue?: JiraLinkedIssue;
  outwardIssue?: JiraLinkedIssue;
}

export interface JiraIssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface JiraLinkedIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: JiraStatus;
    issuetype: JiraIssueType;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls?: JiraAvatarUrls;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl: string;
}

export interface JiraResolution {
  id: string;
  name: string;
  description?: string;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
}

// ============================================
// API Response Types
// ============================================

export interface JiraSearchResponse {
  expand?: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
  warningMessages?: string[];
}

export interface JiraFieldsResponse {
  id: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
    customId?: number;
  };
}

export interface JiraError {
  errorMessages: string[];
  errors: Record<string, string>;
  status?: number;
}

// ============================================
// Atlassian Document Format (Cloud v3)
// ============================================

export interface AdfDocument {
  type: 'doc';
  version: 1;
  content: AdfNode[];
}

export interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: AdfMark[];
}

export interface AdfMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// ============================================
// Type Guards
// ============================================

export function isJiraError(response: unknown): response is JiraError {
  return (
    typeof response === 'object' &&
    response !== null &&
    ('errorMessages' in response || 'errors' in response)
  );
}

export function isEpic(issue: JiraIssue): boolean {
  return (
    issue.fields.issuetype.name.toLowerCase() === 'epic' ||
    issue.fields.issuetype.hierarchyLevel === 1
  );
}

export function isSubtask(issue: JiraIssue): boolean {
  return (
    issue.fields.issuetype.subtask ||
    issue.fields.issuetype.hierarchyLevel === -1
  );
}

// ============================================
// Utility Types
// ============================================

export type IssueTypeName = 'Epic' | 'Story' | 'Task' | 'Bug' | 'Sub-task' | string;

export type StatusCategoryKey = 'new' | 'indeterminate' | 'done';

export const STATUS_CATEGORY_COLORS: Record<StatusCategoryKey, string> = {
  new: '#DFE1E6',
  indeterminate: '#0052CC',
  done: '#00875A'
};

export const ISSUE_TYPE_COLORS: Record<string, string> = {
  Epic: '#904EE2',
  Story: '#63BA3C',
  Task: '#4BADE8',
  Bug: '#E5493A',
  'Sub-task': '#4BADE8',
  Subtask: '#4BADE8'
};
