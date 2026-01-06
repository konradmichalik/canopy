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

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string | AdfDocument;
  created: string;
  updated: string;
}

export interface JiraCommentField {
  comments: JiraComment[];
  maxResults: number;
  total: number;
  startAt: number;
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
  nextPageToken?: string; // Cloud pagination (new API)
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
  return issue.fields.issuetype.subtask || issue.fields.issuetype.hierarchyLevel === -1;
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

// ============================================
// Sprint Types
// ============================================

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId?: number;
  goal?: string;
}

export type SprintState = 'active' | 'future' | 'closed';

export const SPRINT_STATE_ORDER: Record<SprintState, number> = {
  active: 0,
  future: 1,
  closed: 2
};

/**
 * Extract sprint data from an issue's fields
 * Sprint data can be in 'sprint' field (Cloud) or custom fields (Server)
 */
export function extractSprints(issue: JiraIssue): JiraSprint[] {
  const fields = issue.fields as Record<string, unknown>;

  // First, check for direct 'sprint' field (JIRA Cloud)
  const sprintField = fields.sprint;
  if (sprintField) {
    const sprints = tryParseSprintData(sprintField);
    if (sprints.length > 0) {
      return sprints;
    }
  }

  // Then look for sprint in custom fields (Server/Data Center)
  for (const [key, value] of Object.entries(fields)) {
    if (!key.startsWith('customfield_')) continue;
    if (!value) continue;

    const sprints = tryParseSprintData(value);
    if (sprints.length > 0) {
      return sprints;
    }
  }

  return [];
}

/**
 * Try to parse sprint data from various formats
 */
function tryParseSprintData(value: unknown): JiraSprint[] {
  // Handle array format
  if (Array.isArray(value)) {
    if (value.length === 0) return [];

    const firstItem = value[0];

    // Check if it looks like sprint objects
    if (
      firstItem &&
      typeof firstItem === 'object' &&
      'id' in firstItem &&
      'name' in firstItem &&
      'state' in firstItem
    ) {
      return value as JiraSprint[];
    }

    // Handle string format (older JIRA versions)
    if (typeof firstItem === 'string' && firstItem.includes('name=')) {
      return value.map((s) => parseSprintString(s as string)).filter(Boolean) as JiraSprint[];
    }
  }

  // Handle single sprint object (some JIRA configurations)
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    'name' in value &&
    'state' in value
  ) {
    return [value as JiraSprint];
  }

  return [];
}

/**
 * Parse sprint string format from older JIRA versions
 * Format: "com.atlassian.greenhopper.service.sprint.Sprint@12345[id=123,name=Sprint 1,state=ACTIVE,...]"
 */
function parseSprintString(sprintStr: string): JiraSprint | null {
  try {
    const idMatch = sprintStr.match(/id=(\d+)/);
    const nameMatch = sprintStr.match(/name=([^,\]]+)/);
    const stateMatch = sprintStr.match(/state=(\w+)/);
    const startDateMatch = sprintStr.match(/startDate=([^,\]]+)/);
    const endDateMatch = sprintStr.match(/endDate=([^,\]]+)/);

    if (!idMatch || !nameMatch || !stateMatch) return null;

    return {
      id: parseInt(idMatch[1], 10),
      name: nameMatch[1],
      state: stateMatch[1].toLowerCase() as SprintState,
      startDate: startDateMatch?.[1] !== '<null>' ? startDateMatch?.[1] : undefined,
      endDate: endDateMatch?.[1] !== '<null>' ? endDateMatch?.[1] : undefined
    };
  } catch {
    return null;
  }
}
