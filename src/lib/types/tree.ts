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

export interface SavedQuery {
  id: string;
  title: string;
  jql: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// ============================================
// Quick Filters
// ============================================

export interface QuickFilter {
  id: string;
  label: string;
  jqlCondition: string;
  isActive: boolean;
}

export type FilterCategory = 'general' | 'status' | 'type' | 'sprint';

export interface QuickFilterDefinition extends Omit<QuickFilter, 'isActive'> {
  category: FilterCategory;
  icon?: string;
}

// Only static/general filters - status/type filters are generated dynamically from loaded issues
export const DEFAULT_QUICK_FILTERS: QuickFilterDefinition[] = [
  // General filters
  {
    id: 'assigned-to-me',
    label: 'Assigned to me',
    jqlCondition: 'assignee = currentUser()',
    category: 'general',
    icon: 'user'
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    jqlCondition: 'assignee IS EMPTY',
    category: 'general',
    icon: 'user-x'
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
    icon: 'zap'
  }
];

// ============================================
// Router Types
// ============================================

export type Screen = 'dashboard' | 'tree';

export interface RouterState {
  currentScreen: Screen;
  activeQueryId: string | null;
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

export function compareByHierarchy(a: TreeNode, b: TreeNode): number {
  const levelA = getHierarchyLevel(a.issue.fields.issuetype.name);
  const levelB = getHierarchyLevel(b.issue.fields.issuetype.name);

  const orderDiff = HIERARCHY_ORDER[levelA] - HIERARCHY_ORDER[levelB];
  if (orderDiff !== 0) return orderDiff;

  // Same level: sort by key
  return a.issue.key.localeCompare(b.issue.key, undefined, { numeric: true });
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
  queries: SavedQuery[];
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
