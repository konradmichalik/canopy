/**
 * Filters Store
 * Manages quick filter state
 */

import type { JiraIssue, JiraCommentField, QuickFilter } from '../types';
import {
  DEFAULT_QUICK_FILTERS,
  RECENCY_FILTER_OPTIONS,
  type FilterCategory,
  type QuickFilterDefinition,
  type RecencyFilterOption
} from '../types/tree';
import { logger } from '../utils/logger';

// ============================================
// Dynamic Filter Categories
// ============================================

/**
 * Categories for dynamic filters (generated from loaded issues)
 */
export type DynamicFilterCategory =
  | 'project'
  | 'status'
  | 'type'
  | 'assignee'
  | 'priority'
  | 'resolution'
  | 'component'
  | 'fixVersion';

/**
 * All dynamic filter categories in order of display
 */
export const DYNAMIC_FILTER_CATEGORIES: DynamicFilterCategory[] = [
  'project',
  'status',
  'type',
  'assignee',
  'priority',
  'resolution',
  'component',
  'fixVersion'
];

/**
 * Configuration for each dynamic filter category
 */
export interface DynamicFilterCategoryConfig {
  label: string;
  icon: string;
  jqlField: string;
  useIdInJql?: boolean; // Whether to use ID instead of name in JQL (for type, resolution)
  useOrJoin?: boolean; // Whether to use OR join for multiple values (for assignee)
}

export const DYNAMIC_FILTER_CONFIG: Record<DynamicFilterCategory, DynamicFilterCategoryConfig> = {
  project: { label: 'Project', icon: 'folder', jqlField: 'project' },
  status: { label: 'Status', icon: 'status', jqlField: 'status' },
  type: { label: 'Type', icon: 'task', jqlField: 'issuetype', useIdInJql: true },
  assignee: { label: 'Assignee', icon: 'person', jqlField: 'assignee', useOrJoin: true },
  priority: { label: 'Priority', icon: 'priority-high', jqlField: 'priority' },
  resolution: { label: 'Resolution', icon: 'check-circle', jqlField: 'resolution', useIdInJql: true },
  component: { label: 'Component', icon: 'component', jqlField: 'component' },
  fixVersion: { label: 'Release', icon: 'release', jqlField: 'fixVersion' }
};

// ============================================
// Filter ID Helpers (exported for use in components)
// ============================================

/**
 * Generate a filter ID from category prefix and name
 * Used for status, type, priority, component, resolution, fixVersion, project
 */
export function makeFilterId(prefix: string, name: string): string {
  return `${prefix}-${name.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Generate an assignee filter ID (special case with different sanitization)
 * Must match the uniqueKey logic in updateDynamicFilters: accountId || name || key
 */
export function makeAssigneeFilterId(assignee: {
  accountId?: string;
  name?: string;
  key?: string;
}): string {
  const uniqueKey = assignee.accountId || assignee.name || assignee.key || 'unknown';
  return `assignee-${uniqueKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

// Callback for when filters change - set by issues store
let onFiltersChange: (() => void) | null = null;

// Callback to persist active filter changes to query
let onActiveFiltersChange: ((activeFilterIds: string[]) => void) | null = null;

// Callback to persist search text changes to query
let onSearchTextChange: ((searchText: string) => void) | null = null;

export function setFiltersChangeCallback(callback: () => void): void {
  onFiltersChange = callback;
}

export function setActiveFiltersChangeCallback(
  callback: (activeFilterIds: string[]) => void
): void {
  onActiveFiltersChange = callback;
}

export function setSearchTextChangeCallback(callback: (searchText: string) => void): void {
  onSearchTextChange = callback;
}

function notifyFiltersChange(): void {
  if (onFiltersChange) {
    onFiltersChange();
  }
  // Also notify about active filter IDs for persistence
  if (onActiveFiltersChange) {
    onActiveFiltersChange(getActiveFilterIds());
  }
  // Also notify about search text for persistence
  if (onSearchTextChange) {
    onSearchTextChange(filtersState.searchText);
  }
}

/**
 * Get all active filter IDs for persistence
 */
export function getActiveFilterIds(): string[] {
  const filterIds = getActiveFilters().map((f) => f.id);
  // Include recency filter in persisted IDs
  if (filtersState.recencyFilter) {
    filterIds.push(`recency-${filtersState.recencyFilter}`);
  }
  return filterIds;
}

/**
 * Load active filters from saved filter IDs
 * Called when switching queries to restore filter state
 * Sets up pending filter IDs that will be applied after dynamic filters are generated
 */
export function loadActiveFilters(activeFilterIds?: string[], searchText?: string): void {
  // Clear all filters first
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  clearAllDynamicFilters();
  filtersState.searchText = searchText || '';
  filtersState.recencyFilter = null;

  // If no active filters to restore, clear pending and we're done
  if (!activeFilterIds || activeFilterIds.length === 0) {
    filtersState.pendingActiveFilterIds = null;
    logger.debug('Filters cleared for new query');
    return;
  }

  // Extract and apply recency filter if present
  const recencyFilterId = activeFilterIds.find((id) => id.startsWith('recency-'));
  if (recencyFilterId) {
    const recencyOption = recencyFilterId.replace('recency-', '') as RecencyFilterOption;
    if (RECENCY_FILTER_OPTIONS.some((o) => o.id === recencyOption)) {
      filtersState.recencyFilter = recencyOption;
    }
  }

  // Filter out recency filter IDs from the list for other processing
  const otherFilterIds = activeFilterIds.filter((id) => !id.startsWith('recency-'));

  // Store pending filter IDs for restoration after dynamic filters are generated
  filtersState.pendingActiveFilterIds = otherFilterIds.length > 0 ? otherFilterIds : null;

  // Apply to static filters immediately
  const activeIds = new Set(otherFilterIds);
  filtersState.filters = filtersState.filters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));

  logger.debug('Static filters loaded, dynamic filters pending', {
    activeFilterIds,
    recencyFilter: filtersState.recencyFilter
  });
}

/**
 * Apply pending active filters to dynamic filters
 * Called after dynamic filters are generated
 */
function applyPendingActiveFilters(): void {
  if (!filtersState.pendingActiveFilterIds || filtersState.pendingActiveFilterIds.length === 0) {
    return;
  }

  const activeIds = new Set(filtersState.pendingActiveFilterIds);
  setActiveStateByIds(activeIds);

  const hasActiveFilters = activeIds.size > 0;

  logger.debug('Dynamic filters restored from pending', {
    pendingFilterIds: filtersState.pendingActiveFilterIds,
    hasActiveFilters
  });

  // Clear pending
  filtersState.pendingActiveFilterIds = null;

  // Trigger reload with filters if any were activated
  if (hasActiveFilters) {
    notifyFiltersChange();
  }
}

// Extended filter type with category
export interface ExtendedQuickFilter extends QuickFilter {
  category: FilterCategory;
  icon?: string;
  color?: string; // Color from JIRA API (e.g., statusCategory.colorName)
  avatarUrl?: string; // Avatar URL for assignee filters
  iconUrl?: string; // Icon URL from JIRA API (for issue types, priorities)
}

/**
 * Type for the dynamic filters record
 */
export type DynamicFiltersRecord = Record<DynamicFilterCategory, ExtendedQuickFilter[]>;

/**
 * Create empty dynamic filters record
 */
function createEmptyDynamicFilters(): DynamicFiltersRecord {
  return {
    project: [],
    status: [],
    type: [],
    assignee: [],
    priority: [],
    resolution: [],
    component: [],
    fixVersion: []
  };
}

// State container object
export const filtersState = $state({
  filters: DEFAULT_QUICK_FILTERS.map((f) => ({ ...f, isActive: false })) as ExtendedQuickFilter[],
  // Dynamic filters organized by category
  dynamicFilters: createEmptyDynamicFilters(),
  // Temporarily stores filter IDs to restore after dynamic filters are generated
  pendingActiveFilterIds: null as string[] | null,
  // Text search for summary and key
  searchText: '' as string,
  // Recency filter (single select: recently-created, recently-updated, recently-commented)
  recencyFilter: null as RecencyFilterOption
});

// ============================================
// Generic Filter Helpers (DRY)
// ============================================

/**
 * Map function over all dynamic filter categories
 */
function mapAllDynamicFilters(fn: (filter: ExtendedQuickFilter) => ExtendedQuickFilter): void {
  for (const category of DYNAMIC_FILTER_CATEGORIES) {
    filtersState.dynamicFilters[category] = filtersState.dynamicFilters[category].map(fn);
  }
}

/**
 * Get all dynamic filters as a flat array
 */
function getAllDynamicFiltersFlat(): ExtendedQuickFilter[] {
  return DYNAMIC_FILTER_CATEGORIES.flatMap((cat) => filtersState.dynamicFilters[cat]);
}

/**
 * Set active state for all filters based on a set of active IDs
 */
function setActiveStateByIds(activeIds: Set<string>): void {
  mapAllDynamicFilters((f) => ({ ...f, isActive: activeIds.has(f.id) }));
}

/**
 * Clear all dynamic filters (set isActive to false)
 */
function clearAllDynamicFilters(): void {
  mapAllDynamicFilters((f) => ({ ...f, isActive: false }));
}

/**
 * Get dynamic filters for a specific category
 */
export function getDynamicFilters(category: DynamicFilterCategory): ExtendedQuickFilter[] {
  return filtersState.dynamicFilters[category];
}

/**
 * Get all filters
 */
export function getFilters(): QuickFilter[] {
  return filtersState.filters;
}

/**
 * Get active filters (including dynamic)
 */
export function getActiveFilters(): QuickFilter[] {
  const staticActive = filtersState.filters.filter((f) => f.isActive);
  const dynamicActive = getAllDynamicFiltersFlat().filter((f) => f.isActive);
  return [...staticActive, ...dynamicActive];
}

/**
 * Toggle a filter by ID
 */
export function toggleFilter(id: string): void {
  filtersState.filters = filtersState.filters.map((f) =>
    f.id === id ? { ...f, isActive: !f.isActive } : f
  );
  logger.store('filters', 'Toggle filter', {
    id,
    isActive: filtersState.filters.find((f) => f.id === id)?.isActive
  });
  notifyFiltersChange();
}

/**
 * Set filter state
 */
export function setFilter(id: string, isActive: boolean): void {
  filtersState.filters = filtersState.filters.map((f) => (f.id === id ? { ...f, isActive } : f));
}

/**
 * Set search text for filtering by summary and key
 */
export function setSearchText(text: string): void {
  const trimmedText = text.trim();
  if (filtersState.searchText !== trimmedText) {
    filtersState.searchText = trimmedText;
    logger.store('filters', 'Set search text', { text: trimmedText });
    notifyFiltersChange();
  }
}

/**
 * Get current search text
 */
export function getSearchText(): string {
  return filtersState.searchText;
}

/**
 * Clear search text
 */
export function clearSearchText(): void {
  if (filtersState.searchText !== '') {
    filtersState.searchText = '';
    logger.store('filters', 'Cleared search text');
    notifyFiltersChange();
  }
}

/**
 * Set recency filter (single select)
 */
export function setRecencyFilter(option: RecencyFilterOption): void {
  if (filtersState.recencyFilter !== option) {
    filtersState.recencyFilter = option;
    logger.store('filters', 'Set recency filter', { option });
    notifyFiltersChange();
  }
}

/**
 * Get current recency filter
 */
export function getRecencyFilter(): RecencyFilterOption {
  return filtersState.recencyFilter;
}

/**
 * Clear recency filter
 */
export function clearRecencyFilter(): void {
  if (filtersState.recencyFilter !== null) {
    filtersState.recencyFilter = null;
    logger.store('filters', 'Cleared recency filter');
    notifyFiltersChange();
  }
}

/**
 * Clear all filters (including dynamic ones) and persist the change
 */
export function resetFilters(): void {
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  clearAllDynamicFilters();
  filtersState.searchText = '';
  filtersState.recencyFilter = null;
  logger.store('filters', 'Reset all filters');
  notifyFiltersChange();
}

/**
 * Clear all filters (including dynamic ones) - internal use, does not persist
 */
export function clearFilters(): void {
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  clearAllDynamicFilters();
  filtersState.searchText = '';
  filtersState.recencyFilter = null;
  logger.store('filters', 'Cleared all filters');
}

/**
 * Check if "Assigned to me" filter is active
 */
export function isAssignedToMeActive(): boolean {
  return filtersState.filters.find((f) => f.id === 'assigned-to-me')?.isActive ?? false;
}

/**
 * Check if "Unresolved" filter is active
 */
export function isUnresolvedActive(): boolean {
  return filtersState.filters.find((f) => f.id === 'unresolved')?.isActive ?? false;
}

/**
 * Build JQL condition for a category of filters
 */
function buildCategoryJqlCondition(
  filters: ExtendedQuickFilter[],
  category: DynamicFilterCategory
): string | null {
  if (filters.length === 0) return null;
  if (filters.length === 1) return filters[0].jqlCondition;

  const config = DYNAMIC_FILTER_CONFIG[category];

  // Handle OR-join style (for assignee)
  if (config.useOrJoin) {
    const conditions = filters.map((f) => f.jqlCondition).join(' OR ');
    return `(${conditions})`;
  }

  // Handle ID-based JQL (for type, resolution)
  if (config.useIdInJql) {
    const ids = filters
      .map((f) => f.jqlCondition.split('=')[1]?.trim())
      .filter(Boolean)
      .join(', ');
    return `${config.jqlField} IN (${ids})`;
  }

  // Default: use label names
  const names = filters.map((f) => `"${f.label}"`).join(', ');
  return `${config.jqlField} IN (${names})`;
}

/**
 * Get JQL conditions from active filters
 * Filters within the same category (status, type, assignee, etc.) are combined with OR
 * Different categories are combined with AND
 */
export function getActiveFilterConditions(): string[] {
  const activeFilters = getActiveFilters() as ExtendedQuickFilter[];
  const conditions: string[] = [];

  // Build conditions for each dynamic filter category
  for (const category of DYNAMIC_FILTER_CATEGORIES) {
    const categoryFilters = activeFilters.filter((f) => f.category === category);
    const condition = buildCategoryJqlCondition(categoryFilters, category);
    if (condition) {
      conditions.push(condition);
    }
  }

  // Add other filters (general, sprint category) as individual AND conditions
  const dynamicCategories = new Set<string>(DYNAMIC_FILTER_CATEGORIES);
  const otherFilters = activeFilters.filter((f) => !dynamicCategories.has(f.category));
  for (const filter of otherFilters) {
    conditions.push(filter.jqlCondition);
  }

  // Add recency filter condition if set (only for JQL-based filters, not local filtering)
  if (filtersState.recencyFilter) {
    const recencyOption = RECENCY_FILTER_OPTIONS.find((o) => o.id === filtersState.recencyFilter);
    if (recencyOption && recencyOption.jqlCondition) {
      conditions.push(recencyOption.jqlCondition);
    }
  }

  // Note: Text search is handled locally (not via JQL) to support partial key matching
  // See filterIssuesBySearchText() for local filtering

  return conditions;
}

/**
 * Filter issues by search text (local filtering)
 * Searches in both summary (title) and key with partial matching
 */
export function filterIssuesBySearchText(issues: JiraIssue[]): JiraIssue[] {
  const searchText = filtersState.searchText.toLowerCase().trim();

  if (!searchText) {
    return issues;
  }

  return issues.filter((issue) => {
    // Check if key contains the search text (case-insensitive)
    // This allows "127" to match "NE-127" or "PROJECT-1270"
    const keyMatch = issue.key.toLowerCase().includes(searchText);

    // Check if summary contains the search text (case-insensitive)
    const summaryMatch = issue.fields.summary?.toLowerCase().includes(searchText);

    return keyMatch || summaryMatch;
  });
}

/**
 * Check if there is an active search text filter
 */
export function hasSearchTextFilter(): boolean {
  return filtersState.searchText.trim().length > 0;
}

/**
 * Filter issues by recency (local filtering for 'recently-commented')
 * For 'recently-created' and 'recently-updated', JQL handles the filtering
 * For 'recently-commented', we filter locally based on actual comment dates
 */
export function filterIssuesByRecency(issues: JiraIssue[]): JiraIssue[] {
  // Only apply local filtering for 'recently-commented'
  if (filtersState.recencyFilter !== 'recently-commented') {
    return issues;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return issues.filter((issue) => {
    // Access the comment field from issue.fields
    const commentField = (issue.fields as Record<string, unknown>).comment as
      | JiraCommentField
      | undefined;

    if (!commentField || !commentField.comments || commentField.comments.length === 0) {
      return false;
    }

    // Check if any comment was created within the last 7 days
    return commentField.comments.some((comment) => {
      const commentDate = new Date(comment.created);
      return commentDate >= sevenDaysAgo;
    });
  });
}

/**
 * Check if recency filter requires local filtering
 */
export function requiresLocalRecencyFilter(): boolean {
  return filtersState.recencyFilter === 'recently-commented';
}

/**
 * Get all filters including dynamic ones
 */
export function getAllFilters(): ExtendedQuickFilter[] {
  return [...filtersState.filters, ...getAllDynamicFiltersFlat()];
}

// JIRA status category color mapping
const STATUS_CATEGORY_COLORS: Record<string, string> = {
  'blue-gray': '#42526E',
  yellow: '#FF991F',
  green: '#00875A',
  'medium-gray': '#6B778C',
  // Additional fallback mappings for status category keys
  new: '#42526E',
  indeterminate: '#0052CC',
  done: '#00875A'
};

// Avatar color palette (same as Avatar.svelte)
const AVATAR_COLORS = [
  '#0052CC', // Blue
  '#00875A', // Green
  '#FF5630', // Red
  '#6554C0', // Purple
  '#FF991F', // Orange
  '#00B8D9', // Cyan
  '#36B37E', // Teal
  '#E91E63', // Pink
  '#8777D9', // Violet
  '#FFAB00' // Yellow
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getAvatarColor(identifier: string): string {
  const hash = hashString(identifier);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Update dynamic filters based on loaded issues
 */
export function updateDynamicFilters(issues: JiraIssue[]): void {
  // Extract unique values
  const projectMap = new Map<string, { key: string; name: string; avatarUrl?: string }>();
  const statusMap = new Map<string, { name: string; categoryKey: string; colorName: string }>();
  const typeMap = new Map<string, { id: string; name: string; iconUrl?: string }>();
  const assigneeMap = new Map<
    string,
    {
      id: string;
      displayName: string;
      avatarUrl?: string;
      accountId?: string;
      emailAddress?: string;
      name?: string;
    }
  >();
  const priorityMap = new Map<string, { name: string; iconUrl?: string }>();
  const resolutionMap = new Map<string, { id: string; name: string }>();
  const componentMap = new Map<string, { name: string }>();
  const fixVersionMap = new Map<string, { name: string }>();

  for (const issue of issues) {
    // Extract project
    const project = issue.fields.project;
    if (project && !projectMap.has(project.key)) {
      projectMap.set(project.key, {
        key: project.key,
        name: project.name,
        avatarUrl: project.avatarUrls?.['24x24']
      });
    }

    const status = issue.fields.status;
    if (status && !statusMap.has(status.name)) {
      statusMap.set(status.name, {
        name: status.name,
        categoryKey: status.statusCategory?.key || 'undefined',
        colorName: status.statusCategory?.colorName || 'medium-gray'
      });
    }

    const issueType = issue.fields.issuetype;
    if (issueType && !typeMap.has(issueType.name)) {
      typeMap.set(issueType.name, {
        id: issueType.id,
        name: issueType.name,
        iconUrl: issueType.iconUrl
      });
    }

    // Extract assignee
    const assignee = issue.fields.assignee;
    if (assignee) {
      const uniqueKey = assignee.accountId || assignee.name || assignee.key || '';
      if (uniqueKey && !assigneeMap.has(uniqueKey)) {
        assigneeMap.set(uniqueKey, {
          id: uniqueKey,
          displayName: assignee.displayName,
          avatarUrl: assignee.avatarUrls?.['24x24'],
          accountId: assignee.accountId,
          emailAddress: assignee.emailAddress,
          name: assignee.name
        });
      }
    }

    // Extract priority
    const priority = issue.fields.priority;
    if (priority && !priorityMap.has(priority.name)) {
      priorityMap.set(priority.name, {
        name: priority.name,
        iconUrl: priority.iconUrl
      });
    }

    // Extract resolution
    const resolution = issue.fields.resolution;
    if (resolution && !resolutionMap.has(resolution.name)) {
      resolutionMap.set(resolution.name, {
        id: resolution.id,
        name: resolution.name
      });
    }

    // Extract components
    const components = issue.fields.components;
    if (components && components.length > 0) {
      for (const component of components) {
        if (!componentMap.has(component.name)) {
          componentMap.set(component.name, {
            name: component.name
          });
        }
      }
    }

    // Extract fix versions
    const fixVersions = (issue.fields as Record<string, unknown>).fixVersions as
      | { name: string }[]
      | undefined;
    if (fixVersions && fixVersions.length > 0) {
      for (const version of fixVersions) {
        if (!fixVersionMap.has(version.name)) {
          fixVersionMap.set(version.name, {
            name: version.name
          });
        }
      }
    }
  }

  // Preserve active state of existing filters (collect all active IDs)
  const activeIds = new Set(
    getAllDynamicFiltersFlat()
      .filter((f) => f.isActive)
      .map((f) => f.id)
  );

  // Create project filters sorted alphabetically
  const sortedProjects = Array.from(projectMap.entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );
  filtersState.dynamicFilters.project = sortedProjects.map(([key, data]) => {
    const id = makeFilterId('project', key);
    return {
      id,
      label: data.name,
      jqlCondition: `project = "${key}"`,
      category: 'project' as FilterCategory,
      icon: 'folder',
      avatarUrl: data.avatarUrl,
      isActive: activeIds.has(id)
    };
  });

  // Create status filters with colors
  filtersState.dynamicFilters.status = Array.from(statusMap.entries()).map(([name, data]) => {
    const id = makeFilterId('status', name);
    return {
      id,
      label: name,
      jqlCondition: `status = "${name}"`,
      category: 'status' as FilterCategory,
      icon: getStatusIcon(data.categoryKey),
      color:
        STATUS_CATEGORY_COLORS[data.colorName] ||
        STATUS_CATEGORY_COLORS[data.categoryKey] ||
        '#6B778C',
      isActive: activeIds.has(id)
    };
  });

  // Create type filters using iconUrl from JIRA API
  filtersState.dynamicFilters.type = Array.from(typeMap.entries()).map(([name, data]) => {
    const id = makeFilterId('type', name);
    return {
      id,
      label: name,
      jqlCondition: `issuetype = ${data.id}`,
      category: 'type' as FilterCategory,
      iconUrl: data.iconUrl,
      isActive: activeIds.has(id)
    };
  });

  // Create assignee filters sorted by display name
  const sortedAssignees = Array.from(assigneeMap.entries()).sort((a, b) =>
    a[1].displayName.localeCompare(b[1].displayName)
  );
  filtersState.dynamicFilters.assignee = sortedAssignees.map(([key, data]) => {
    const id = `assignee-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const jqlValue = data.accountId ? `"${data.accountId}"` : `"${data.name}"`;
    const colorIdentifier = data.accountId || data.emailAddress || data.displayName;
    return {
      id,
      label: data.displayName,
      jqlCondition: `assignee = ${jqlValue}`,
      category: 'assignee' as FilterCategory,
      icon: 'person',
      avatarUrl: data.avatarUrl,
      color: getAvatarColor(colorIdentifier),
      isActive: activeIds.has(id)
    };
  });

  // Create priority filters sorted by name
  const sortedPriorities = Array.from(priorityMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicFilters.priority = sortedPriorities.map(([name, data]) => {
    const id = makeFilterId('priority', name);
    return {
      id,
      label: name,
      jqlCondition: `priority = "${name}"`,
      category: 'priority' as FilterCategory,
      iconUrl: data.iconUrl,
      isActive: activeIds.has(id)
    };
  });

  // Create resolution filters sorted by name
  const sortedResolutions = Array.from(resolutionMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicFilters.resolution = sortedResolutions.map(([name, data]) => {
    const id = makeFilterId('resolution', name);
    return {
      id,
      label: name,
      jqlCondition: `resolution = ${data.id}`,
      category: 'resolution' as FilterCategory,
      icon: 'check-circle',
      color: '#00875A',
      isActive: activeIds.has(id)
    };
  });

  // Create component filters sorted by name
  const sortedComponents = Array.from(componentMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicFilters.component = sortedComponents.map(([name]) => {
    const id = makeFilterId('component', name);
    return {
      id,
      label: name,
      jqlCondition: `component = "${name}"`,
      category: 'component' as FilterCategory,
      icon: 'component',
      isActive: activeIds.has(id)
    };
  });

  // Create fix version filters sorted by name
  const sortedFixVersions = Array.from(fixVersionMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicFilters.fixVersion = sortedFixVersions.map(([name]) => {
    const id = makeFilterId('fixversion', name);
    return {
      id,
      label: name,
      jqlCondition: `fixVersion = "${name}"`,
      category: 'fixVersion' as FilterCategory,
      icon: 'release',
      isActive: activeIds.has(id)
    };
  });

  logger.store('filters', 'Updated dynamic filters', {
    projects: filtersState.dynamicFilters.project.length,
    statuses: filtersState.dynamicFilters.status.length,
    types: filtersState.dynamicFilters.type.length,
    assignees: filtersState.dynamicFilters.assignee.length,
    priorities: filtersState.dynamicFilters.priority.length,
    resolutions: filtersState.dynamicFilters.resolution.length,
    components: filtersState.dynamicFilters.component.length,
    fixVersions: filtersState.dynamicFilters.fixVersion.length
  });

  // Apply pending active filters if any
  applyPendingActiveFilters();
}

/**
 * Get icon for status based on category (Atlaskit icon names)
 */
function getStatusIcon(categoryKey: string): string {
  switch (categoryKey) {
    case 'new':
    case 'undefined':
      return 'circle-filled';
    case 'indeterminate':
      return 'refresh';
    case 'done':
      return 'check-circle';
    default:
      return 'circle';
  }
}

/**
 * Toggle a dynamic filter by ID
 */
export function toggleDynamicFilter(id: string): void {
  // Search in all dynamic filter categories
  for (const category of DYNAMIC_FILTER_CATEGORIES) {
    const filters = filtersState.dynamicFilters[category];
    const index = filters.findIndex((f) => f.id === id);

    if (index !== -1) {
      filtersState.dynamicFilters[category] = filters.map((f) =>
        f.id === id ? { ...f, isActive: !f.isActive } : f
      );
      logger.store('filters', `Toggle dynamic ${category} filter`, { id });
      notifyFiltersChange();
      return;
    }
  }

  // Otherwise, toggle regular filter
  toggleFilter(id);
}
