/**
 * Tree Structure Types
 */

import type { JiraIssue } from './jira';

// ============================================
// Tree Node
// ============================================

export interface TreeNode {
  issue: JiraIssue;
  children: TreeNode[];
  depth: number;
  isExpanded: boolean;
  isVisible: boolean;
  parentKey: string | null;
  // Cached aggregated progress (calculated during tree build for performance)
  cachedTimeProgress?: { logged: number; total: number; percent: number };
  cachedResolutionProgress?: { done: number; total: number; percent: number };
}

// ============================================
// Tree State
// ============================================

export interface TreeState {
  nodes: TreeNode[];
  expandedKeys: Set<string>;
  selectedKey: string | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// Hierarchy Levels
// ============================================

export type HierarchyLevel = 'epic' | 'story' | 'task' | 'subtask' | 'unknown';

export const HIERARCHY_ORDER: Record<HierarchyLevel, number> = {
  epic: 0,
  story: 1,
  task: 2,
  subtask: 3,
  unknown: 99
};

// Map issue type names to hierarchy levels
export const HIERARCHY_MAPPING: Record<string, HierarchyLevel> = {
  Epic: 'epic',
  Story: 'story',
  Task: 'task',
  Bug: 'task',
  'Sub-task': 'subtask',
  Subtask: 'subtask',
  'Technical Task': 'task',
  Improvement: 'task',
  'New Feature': 'story',
  Feature: 'story'
};

// ============================================
// Saved Queries
// ============================================

export type QueryColor =
  | 'gray'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'teal';

export const QUERY_COLORS: { id: QueryColor; label: string; bg: string; border: string }[] = [
  { id: 'gray', label: 'Gray', bg: 'bg-neutral-500', border: 'border-neutral-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
  { id: 'green', label: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', border: 'border-yellow-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500' },
  { id: 'red', label: 'Red', bg: 'bg-red-500', border: 'border-red-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500', border: 'border-teal-500' }
];

export type GroupByOption =
  | 'none'
  | 'sprint'
  | 'assignee'
  | 'status'
  | 'project'
  | 'recency'
  | 'release';

/** Available icons for custom filters */
export const CUSTOM_FILTER_ICONS = [
  'filter',
  'tag',
  'folder',
  'story',
  'check-circle',
  'sprint',
  'layers',
  'dashboard',
  'star',
  'warning',
  'person'
] as const;

export type CustomFilterIcon = (typeof CUSTOM_FILTER_ICONS)[number];

/**
 * A saved filter combination (per-query)
 */
export interface CustomFilter {
  id: string;
  name: string;
  /** Optional icon for the filter */
  icon?: CustomFilterIcon;
  /** Saved filter IDs (static + dynamic filters) */
  filterIds: string[];
  /** Saved recency filter option */
  recencyFilter: RecencyFilterOption;
  /** Saved search text */
  searchText: string;
  createdAt: string;
}

export interface SavedQuery {
  /** Discriminator for union type (optional for backward compatibility) */
  type?: 'query';
  id: string;
  title: string;
  jql: string;
  color?: QueryColor;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  displayFields?: string[];
  activeFilterIds?: string[];
  searchText?: string;
  sortConfig?: SortConfig;
  /** Grouping mode for the tree view */
  groupBy?: GroupByOption;
  /** Show a collapsible entry node wrapper with aggregated stats */
  showEntryNode?: boolean;
  /** Whether the options panel (filters, grouping, sorting) is expanded */
  optionsExpanded?: boolean;
  /** Cached issue count from last query execution */
  cachedIssueCount?: number;
  /** Saved filter combinations for this query */
  customFilters?: CustomFilter[];
  /** Currently active custom filter ID */
  activeCustomFilterId?: string | null;
}

// ============================================
// Query Separators
// ============================================

export interface QuerySeparator {
  type: 'separator';
  id: string;
  /** Optional title - empty means just a line divider */
  title?: string;
  createdAt: string;
  updatedAt: string;
}

/** Union type for items in the query list */
export type QueryListItem = SavedQuery | QuerySeparator;

/** Type guard: check if item is a separator */
export function isSeparator(item: QueryListItem): item is QuerySeparator {
  return item.type === 'separator';
}

/** Type guard: check if item is a query */
export function isQuery(item: QueryListItem): item is SavedQuery {
  return item.type === 'query' || item.type === undefined;
}

export function generateSeparatorId(): string {
  return `separator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Sort Configuration
// ============================================

export type SortField = 'key' | 'priority' | 'created' | 'updated' | 'duedate' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface SortFieldDefinition {
  id: SortField;
  label: string;
}

export const SORT_FIELDS: SortFieldDefinition[] = [
  { id: 'key', label: 'Key' },
  { id: 'priority', label: 'Priority' },
  { id: 'created', label: 'Created' },
  { id: 'updated', label: 'Updated' },
  { id: 'duedate', label: 'Due Date' },
  { id: 'status', label: 'Status' }
];

export const DEFAULT_SORT_CONFIG: SortConfig = {
  field: 'updated',
  direction: 'desc'
};

// ============================================
// Quick Filters
// ============================================

export interface QuickFilter {
  id: string;
  label: string;
  jqlCondition: string;
  isActive: boolean;
}

export type FilterCategory =
  | 'general'
  | 'project'
  | 'status'
  | 'type'
  | 'sprint'
  | 'assignee'
  | 'priority'
  | 'resolution'
  | 'component'
  | 'fixVersion'
  | 'recency';

// ============================================
// Recency Filter Options
// ============================================

export type RecencyFilterOption =
  | 'recently-created'
  | 'recently-updated'
  | 'recently-commented'
  | null;

export interface RecencyFilterDefinition {
  id: RecencyFilterOption;
  label: string;
  jqlCondition: string;
  icon: string;
}

export const RECENCY_FILTER_OPTIONS: RecencyFilterDefinition[] = [
  {
    id: 'recently-created',
    label: 'Recently created',
    jqlCondition: 'created >= -7d',
    icon: 'add'
  },
  {
    id: 'recently-updated',
    label: 'Recently updated',
    jqlCondition: 'updated >= -7d',
    icon: 'edit'
  },
  {
    id: 'recently-commented',
    label: 'Recently commented',
    jqlCondition: '', // Uses local filtering based on actual comment dates
    icon: 'comment'
  }
];

export interface QuickFilterDefinition extends Omit<QuickFilter, 'isActive'> {
  category: FilterCategory;
  icon?: string;
}

// Only static/general filters - status/type filters are generated dynamically from loaded issues
// Icons use Atlaskit icon names
export const DEFAULT_QUICK_FILTERS: QuickFilterDefinition[] = [
  // General filters
  {
    id: 'assigned-to-me',
    label: 'Assigned to me',
    jqlCondition: 'assignee = currentUser()',
    category: 'general',
    icon: 'person'
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    jqlCondition: 'assignee IS EMPTY',
    category: 'general',
    icon: 'person-offboard'
  },
  {
    id: 'unresolved',
    label: 'Unresolved',
    jqlCondition: 'resolution = EMPTY',
    category: 'general',
    icon: 'circle'
  },
  {
    id: 'current-sprint',
    label: 'Current Sprint',
    jqlCondition: 'sprint in openSprints()',
    category: 'sprint',
    icon: 'sprint'
  }
];

// ============================================
// Router Types
// ============================================

export interface RouterState {
  activeQueryId: string | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
}

// ============================================
// Theme Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

// ============================================
// Utility Functions
// ============================================

export function getHierarchyLevel(issueTypeName: string): HierarchyLevel {
  return HIERARCHY_MAPPING[issueTypeName] || 'unknown';
}

/**
 * Priority order mapping (lower number = higher priority)
 */
const PRIORITY_ORDER: Record<string, number> = {
  Blocker: 0,
  Critical: 1,
  Highest: 1,
  High: 2,
  Medium: 3,
  Normal: 3,
  Low: 4,
  Lowest: 5,
  Minor: 5,
  Trivial: 6
};

/**
 * Get priority sort value (lower = higher priority)
 */
function getPriorityOrder(priorityName: string | undefined | null): number {
  if (!priorityName) return 999; // No priority = lowest
  return PRIORITY_ORDER[priorityName] ?? 50; // Unknown priorities in middle
}

/**
 * Compare two tree nodes by user-selected sort field
 */
export function compareNodes(a: TreeNode, b: TreeNode, sortConfig?: SortConfig): number {
  const field = sortConfig?.field ?? 'key';
  const direction = sortConfig?.direction ?? 'asc';
  const multiplier = direction === 'asc' ? 1 : -1;

  let comparison = 0;

  switch (field) {
    case 'key':
      comparison = a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
      break;

    case 'priority': {
      const prioA = getPriorityOrder(a.issue.fields.priority?.name);
      const prioB = getPriorityOrder(b.issue.fields.priority?.name);
      comparison = prioA - prioB;
      // Fallback to key if priorities are equal
      if (comparison === 0) {
        comparison = a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
      }
      break;
    }

    case 'created': {
      const createdA = new Date(a.issue.fields.created).getTime();
      const createdB = new Date(b.issue.fields.created).getTime();
      comparison = createdA - createdB;
      break;
    }

    case 'updated': {
      const updatedA = new Date(a.issue.fields.updated).getTime();
      const updatedB = new Date(b.issue.fields.updated).getTime();
      comparison = updatedA - updatedB;
      break;
    }

    case 'duedate': {
      // Null/undefined due dates go to the end
      const dueDateA = a.issue.fields.duedate
        ? new Date(a.issue.fields.duedate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const dueDateB = b.issue.fields.duedate
        ? new Date(b.issue.fields.duedate).getTime()
        : Number.MAX_SAFE_INTEGER;
      comparison = dueDateA - dueDateB;
      // Fallback to key if due dates are equal
      if (comparison === 0) {
        comparison = a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
      }
      break;
    }

    case 'status': {
      const statusA = a.issue.fields.status.name;
      const statusB = b.issue.fields.status.name;
      comparison = statusA.localeCompare(statusB);
      // Fallback to key if statuses are equal
      if (comparison === 0) {
        comparison = a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
      }
      break;
    }

    default:
      comparison = a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
  }

  return comparison * multiplier;
}

export function generateQueryId(): string {
  return `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Export/Import Configuration
// ============================================

export interface ExportedConfig {
  version: number;
  exportedAt: string;
  connection: ExportedConnection | null;
  queries: QueryListItem[];
  displayFields?: string[];
}

export interface ExportedConnection {
  instanceType: 'cloud' | 'server';
  baseUrl: string;
  credentials: ExportedCredentials;
  proxyUrl?: string;
}

export interface ExportedCredentials {
  type: 'cloud' | 'server';
  // Cloud
  email?: string;
  apiToken?: string;
  // Server
  authMethod?: 'basic' | 'pat';
  username?: string;
  password?: string;
  personalAccessToken?: string;
}

// ============================================
// Single Query Export/Import
// ============================================

export interface ExportedSingleQuery {
  version: number;
  exportedAt: string;
  type: 'single-query';
  query: SavedQuery;
}
