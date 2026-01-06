/**
 * Grouping Store
 * Manages issue grouping by sprint, assignee, status, etc.
 */

import type { JiraIssue, JiraSprint, SprintState } from '../types/jira';
import type { TreeNode } from '../types/tree';
import { extractSprints, SPRINT_STATE_ORDER } from '../types/jira';
import { buildHierarchy } from '../utils/hierarchy-builder';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

// ============================================
// Types
// ============================================

export type GroupByOption = 'none' | 'sprint' | 'assignee' | 'status' | 'project';

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

export type GroupMetadata = SprintGroupMetadata | AssigneeGroupMetadata | StatusGroupMetadata | ProjectGroupMetadata;

// ============================================
// State
// ============================================

const initialGroupBy = getStorageItem<GroupByOption>(STORAGE_KEYS.GROUP_BY) ?? 'none';

export const groupingState = $state({
  groupBy: initialGroupBy as GroupByOption
});

// ============================================
// Actions
// ============================================

export function setGroupBy(groupBy: GroupByOption): void {
  groupingState.groupBy = groupBy;
  setStorageItem(STORAGE_KEYS.GROUP_BY, groupBy);
}

// ============================================
// Grouping Functions
// ============================================

/**
 * Group issues by the selected grouping option
 */
export function groupIssues(
  issues: JiraIssue[],
  groupBy: GroupByOption,
  epicLinkFieldId?: string
): IssueGroup[] {
  switch (groupBy) {
    case 'sprint':
      return groupBySprint(issues, epicLinkFieldId);
    case 'assignee':
      return groupByAssignee(issues, epicLinkFieldId);
    case 'status':
      return groupByStatus(issues, epicLinkFieldId);
    case 'project':
      return groupByProject(issues, epicLinkFieldId);
    default:
      return [];
  }
}

/**
 * Group issues by sprint
 */
function groupBySprint(issues: JiraIssue[], epicLinkFieldId?: string): IssueGroup[] {
  const sprintMap = new Map<string, { sprint: JiraSprint | null; issues: JiraIssue[] }>();

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
    const treeNodes = buildHierarchy(groupIssues, { epicLinkFieldId });

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
function groupByAssignee(issues: JiraIssue[], epicLinkFieldId?: string): IssueGroup[] {
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
    const treeNodes = buildHierarchy(groupIssues, { epicLinkFieldId });

    groups.push({
      id: `assignee-${id}`,
      label: assignee?.displayName ?? 'Unassigned',
      issues: groupIssues,
      treeNodes,
      metadata: {
        type: 'assignee',
        avatarUrl: assignee?.avatarUrls?.['24x24'],
        accountId: assignee?.accountId ?? assignee?.name
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
function groupByStatus(issues: JiraIssue[], epicLinkFieldId?: string): IssueGroup[] {
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
    const treeNodes = buildHierarchy(groupIssues, { epicLinkFieldId });

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
function groupByProject(issues: JiraIssue[], epicLinkFieldId?: string): IssueGroup[] {
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
    const treeNodes = buildHierarchy(groupIssues, { epicLinkFieldId });

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
  { id: 'assignee', label: 'Assignee', icon: 'user' },
  { id: 'status', label: 'Status', icon: 'status' },
  { id: 'project', label: 'Project', icon: 'folder' }
];
