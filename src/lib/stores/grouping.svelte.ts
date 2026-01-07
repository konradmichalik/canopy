/**
 * Grouping Store
 * Manages issue grouping by sprint, assignee, status, etc.
 */

import type { JiraIssue, JiraSprint, SprintState } from '../types/jira';
import type { TreeNode, SortConfig, GroupByOption } from '../types/tree';
import { extractSprints, SPRINT_STATE_ORDER } from '../types/jira';
import { buildFlatList } from '../utils/hierarchy-builder';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// Re-export GroupByOption for convenience
export type { GroupByOption } from '../types/tree';

export interface IssueGroup {
  id: string;
  label: string;
  subtitle?: string;
  issues: JiraIssue[];
  treeNodes: TreeNode[];
  metadata?: GroupMetadata;
}

export interface SprintGroupMetadata {
  type: 'sprint';
  sprint: JiraSprint | null;
  state: SprintState | 'none';
  startDate?: Date;
  endDate?: Date;
  progress: {
    done: number;
    total: number;
    percentage: number;
  };
}

export interface AssigneeGroupMetadata {
  type: 'assignee';
  avatarUrl?: string;
  accountId?: string;
  emailAddress?: string;
  displayName?: string;
}

export interface StatusGroupMetadata {
  type: 'status';
  categoryKey: string;
  categoryColor: string;
}

export interface ProjectGroupMetadata {
  type: 'project';
  projectKey: string;
  avatarUrl?: string;
}

export type GroupMetadata =
  | SprintGroupMetadata
  | AssigneeGroupMetadata
  | StatusGroupMetadata
  | ProjectGroupMetadata;

// ============================================
// Callbacks for grouping changes
// ============================================

const groupingChangeCallbacks: Array<(groupBy: GroupByOption) => void> = [];

export function setGroupingChangeCallback(callback: (groupBy: GroupByOption) => void): void {
  if (!groupingChangeCallbacks.includes(callback)) {
    groupingChangeCallbacks.push(callback);
  }
}

function notifyChange(): void {
  for (const callback of groupingChangeCallbacks) {
    callback(groupingState.groupBy);
  }
}

// ============================================
// State
// ============================================

export const groupingState = $state({
  groupBy: 'none' as GroupByOption,
  currentQueryId: null as string | null
});

// ============================================
// Actions
// ============================================

/**
 * Load grouping configuration for a query
 */
export function loadGroupConfig(queryId: string, groupBy?: GroupByOption): void {
  groupingState.groupBy = groupBy || 'none';
  groupingState.currentQueryId = queryId;
  logger.debug('Grouping config loaded for query', { queryId, groupBy: groupingState.groupBy });
}

/**
 * Initialize grouping configuration with defaults
 */
export function initializeGroupConfig(): void {
  groupingState.groupBy = 'none';
  groupingState.currentQueryId = null;
  logger.debug('Grouping config initialized with defaults');
}

export function setGroupBy(groupBy: GroupByOption): void {
  if (groupingState.groupBy !== groupBy) {
    groupingState.groupBy = groupBy;
    notifyChange();
    logger.debug(`Grouping set to "${groupBy}"`);
  }
}

/**
 * Get current grouping option
 */
export function getGroupBy(): GroupByOption {
  return groupingState.groupBy;
}

// ============================================
// Grouping Functions
// ============================================

/**
 * Group issues by the selected grouping option
 * Note: Grouped views use a flat list (no hierarchy) since parent-child
 * relationships may span across different groups
 */
export function groupIssues(
  issues: JiraIssue[],
  groupBy: GroupByOption,
  sortConfig?: SortConfig
): IssueGroup[] {
  switch (groupBy) {
    case 'sprint':
      return groupBySprint(issues, sortConfig);
    case 'assignee':
      return groupByAssignee(issues, sortConfig);
    case 'status':
      return groupByStatus(issues, sortConfig);
    case 'project':
      return groupByProject(issues, sortConfig);
    default:
      return [];
  }
}

/**
 * Group issues by sprint
 */
function groupBySprint(issues: JiraIssue[], sortConfig?: SortConfig): IssueGroup[] {
  const sprintMap = new Map<string, { sprint: JiraSprint | null; issues: JiraIssue[] }>();

  // Debug: Log first issue to see sprint field structure
  if (issues.length > 0) {
    const firstIssue = issues[0];
    const fields = firstIssue.fields as Record<string, unknown>;
    const customFieldsWithValues = Object.entries(fields)
      .filter(([k, v]) => k.startsWith('customfield_') && v !== null && v !== undefined)
      .map(([k, v]) => ({ key: k, type: Array.isArray(v) ? 'array' : typeof v, value: v }));
    console.debug('[Sprint Grouping] First issue fields:', {
      key: firstIssue.key,
      sprint: fields.sprint,
      customFieldsWithValues
    });
  }

  // Group issues by sprint
  for (const issue of issues) {
    const sprints = extractSprints(issue);

    if (sprints.length === 0) {
      // No sprint - add to "No Sprint" group
      const key = 'no-sprint';
      if (!sprintMap.has(key)) {
        sprintMap.set(key, { sprint: null, issues: [] });
      }
      sprintMap.get(key)!.issues.push(issue);
    } else {
      // Add to each sprint (issue can be in multiple sprints)
      for (const sprint of sprints) {
        const key = `sprint-${sprint.id}`;
        if (!sprintMap.has(key)) {
          sprintMap.set(key, { sprint, issues: [] });
        }
        sprintMap.get(key)!.issues.push(issue);
      }
    }
  }

  // Convert to IssueGroup array and sort
  const groups: IssueGroup[] = [];

  for (const [id, { sprint, issues: groupIssues }] of sprintMap) {
    // Calculate progress
    const doneCount = groupIssues.filter(
      (i) => i.fields.status.statusCategory.key === 'done'
    ).length;
    const totalCount = groupIssues.length;

    // Build hierarchy within the group
    const treeNodes = buildFlatList(groupIssues, { sortConfig });

    // Format dates
    let subtitle: string | undefined;
    if (sprint?.startDate && sprint?.endDate) {
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);
      subtitle = `${formatShortDate(start)} - ${formatShortDate(end)}`;
    }

    groups.push({
      id,
      label: sprint?.name ?? 'No Sprint',
      subtitle,
      issues: groupIssues,
      treeNodes,
      metadata: {
        type: 'sprint',
        sprint,
        state: sprint?.state ?? 'none',
        startDate: sprint?.startDate ? new Date(sprint.startDate) : undefined,
        endDate: sprint?.endDate ? new Date(sprint.endDate) : undefined,
        progress: {
          done: doneCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
        }
      } as SprintGroupMetadata
    });
  }

  // Sort: Active > Future > Closed > No Sprint
  groups.sort((a, b) => {
    const metaA = a.metadata as SprintGroupMetadata;
    const metaB = b.metadata as SprintGroupMetadata;

    // No Sprint always last
    if (metaA.state === 'none') return 1;
    if (metaB.state === 'none') return -1;

    // Sort by sprint state
    const stateOrder =
      SPRINT_STATE_ORDER[metaA.state as SprintState] -
      SPRINT_STATE_ORDER[metaB.state as SprintState];
    if (stateOrder !== 0) return stateOrder;

    // Within same state, sort by start date
    if (metaA.startDate && metaB.startDate) {
      return metaA.startDate.getTime() - metaB.startDate.getTime();
    }

    return 0;
  });

  return groups;
}

/**
 * Group issues by assignee
 */
function groupByAssignee(issues: JiraIssue[], sortConfig?: SortConfig): IssueGroup[] {
  const assigneeMap = new Map<string, JiraIssue[]>();

  for (const issue of issues) {
    const assignee = issue.fields.assignee;
    const key = assignee?.accountId ?? assignee?.name ?? 'unassigned';
    const label = assignee?.displayName ?? 'Unassigned';

    if (!assigneeMap.has(key)) {
      assigneeMap.set(key, []);
    }
    assigneeMap.get(key)!.push(issue);
  }

  const groups: IssueGroup[] = [];

  for (const [id, groupIssues] of assigneeMap) {
    const firstIssue = groupIssues[0];
    const assignee = firstIssue.fields.assignee;
    const treeNodes = buildFlatList(groupIssues, { sortConfig });

    groups.push({
      id: `assignee-${id}`,
      label: assignee?.displayName ?? 'Unassigned',
      issues: groupIssues,
      treeNodes,
      metadata: {
        type: 'assignee',
        avatarUrl: assignee?.avatarUrls?.['24x24'],
        // Keep raw values without fallbacks - the color logic in GroupHeader uses the same
        // fallback chain as Avatar.svelte: accountId || emailAddress || displayName
        accountId: assignee?.accountId,
        emailAddress: assignee?.emailAddress,
        displayName: assignee?.displayName
      } as AssigneeGroupMetadata
    });
  }

  // Sort: Unassigned last, then alphabetically
  groups.sort((a, b) => {
    if (a.id === 'assignee-unassigned') return 1;
    if (b.id === 'assignee-unassigned') return -1;
    return a.label.localeCompare(b.label);
  });

  return groups;
}

/**
 * Group issues by status
 */
function groupByStatus(issues: JiraIssue[], sortConfig?: SortConfig): IssueGroup[] {
  const statusMap = new Map<string, JiraIssue[]>();

  for (const issue of issues) {
    const status = issue.fields.status;
    const key = status.id;

    if (!statusMap.has(key)) {
      statusMap.set(key, []);
    }
    statusMap.get(key)!.push(issue);
  }

  const groups: IssueGroup[] = [];

  for (const [id, groupIssues] of statusMap) {
    const firstIssue = groupIssues[0];
    const status = firstIssue.fields.status;
    const treeNodes = buildFlatList(groupIssues, { sortConfig });

    groups.push({
      id: `status-${id}`,
      label: status.name,
      issues: groupIssues,
      treeNodes,
      metadata: {
        type: 'status',
        categoryKey: status.statusCategory.key,
        categoryColor: status.statusCategory.colorName
      } as StatusGroupMetadata
    });
  }

  // Sort by status category: To Do > In Progress > Done
  const categoryOrder: Record<string, number> = {
    new: 0,
    indeterminate: 1,
    done: 2
  };

  groups.sort((a, b) => {
    const metaA = a.metadata as StatusGroupMetadata;
    const metaB = b.metadata as StatusGroupMetadata;
    return (categoryOrder[metaA.categoryKey] ?? 99) - (categoryOrder[metaB.categoryKey] ?? 99);
  });

  return groups;
}

/**
 * Group issues by project
 */
function groupByProject(issues: JiraIssue[], sortConfig?: SortConfig): IssueGroup[] {
  const projectMap = new Map<string, JiraIssue[]>();

  for (const issue of issues) {
    const project = issue.fields.project;
    const key = project.key;

    if (!projectMap.has(key)) {
      projectMap.set(key, []);
    }
    projectMap.get(key)!.push(issue);
  }

  const groups: IssueGroup[] = [];

  for (const [key, groupIssues] of projectMap) {
    const firstIssue = groupIssues[0];
    const project = firstIssue.fields.project;
    const treeNodes = buildFlatList(groupIssues, { sortConfig });

    groups.push({
      id: `project-${key}`,
      label: project.name,
      subtitle: key,
      issues: groupIssues,
      treeNodes,
      metadata: {
        type: 'project',
        projectKey: key,
        avatarUrl: project.avatarUrls?.['24x24']
      } as ProjectGroupMetadata
    });
  }

  // Sort alphabetically by project name
  groups.sort((a, b) => a.label.localeCompare(b.label));

  return groups;
}

// ============================================
// Helpers
// ============================================

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short'
  });
}

// ============================================
// Group By Options
// ============================================

export const GROUP_BY_OPTIONS: { id: GroupByOption; label: string; icon: string }[] = [
  { id: 'none', label: 'No Grouping', icon: 'list' },
  { id: 'sprint', label: 'Sprint', icon: 'sprint' },
  { id: 'assignee', label: 'Assignee', icon: 'person' },
  { id: 'status', label: 'Status', icon: 'status' },
  { id: 'project', label: 'Project', icon: 'folder' }
];
