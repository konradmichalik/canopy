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
  type RecencyFilterOption,
  type CustomFilter,
  type CustomFilterIcon,
  CUSTOM_FILTER_ICONS
} from '../types/tree';
import { getAvatarColor } from '../utils/avatar-colors';
import { logger } from '../utils/logger';

// Re-export for convenience
export { CUSTOM_FILTER_ICONS, type CustomFilter, type CustomFilterIcon };

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
  resolution: {
    label: 'Resolution',
    icon: 'check-circle',
    jqlField: 'resolution',
    useIdInJql: true
  },
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
  recencyFilter: null as RecencyFilterOption,
  // Custom filters (user-saved filter combinations)
  customFilters: [] as CustomFilter[],
  // Currently active custom filter ID (null if none active)
  activeCustomFilterId: null as string | null
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
  // Clear active custom filter when manually changing filters
  if (filtersState.activeCustomFilterId) {
    filtersState.activeCustomFilterId = null;
  }

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
    // Clear active custom filter when manually changing search
    if (filtersState.activeCustomFilterId) {
      filtersState.activeCustomFilterId = null;
    }
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
    // Clear active custom filter when manually changing recency
    if (filtersState.activeCustomFilterId) {
      filtersState.activeCustomFilterId = null;
    }
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
  filtersState.activeCustomFilterId = null;
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
  filtersState.activeCustomFilterId = null;
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


/**
 * Update dynamic filters based on loaded issues
 * Merges new filter values with existing ones to preserve filter options
 * when filters are active (which would otherwise reduce the issue set)
 */
export function updateDynamicFilters(issues: JiraIssue[], options?: { replace?: boolean }): void {
  const shouldReplace = options?.replace ?? false;

  // Extract unique values from new issues
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

  // Helper to merge filters: keep existing ones (unless replacing), add new ones
  function mergeFilters<T>(
    newEntries: [string, T][],
    category: DynamicFilterCategory,
    createFilter: (key: string, data: T) => ExtendedQuickFilter
  ): ExtendedQuickFilter[] {
    const existingMap = new Map(filtersState.dynamicFilters[category].map((f) => [f.id, f]));
    const resultMap = new Map<string, ExtendedQuickFilter>();

    // Keep existing filters if not replacing
    if (!shouldReplace) {
      for (const [id, filter] of existingMap) {
        resultMap.set(id, filter);
      }
    }

    // Add/update with new filters (preserve active state)
    for (const [key, data] of newEntries) {
      const filter = createFilter(key, data);
      resultMap.set(filter.id, {
        ...filter,
        isActive: existingMap.get(filter.id)?.isActive ?? false
      });
    }

    return Array.from(resultMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  // Create project filters
  filtersState.dynamicFilters.project = mergeFilters(
    Array.from(projectMap.entries()),
    'project',
    (key, data) => ({
      id: makeFilterId('project', key),
      label: data.name,
      jqlCondition: `project = "${key}"`,
      category: 'project' as FilterCategory,
      icon: 'folder',
      avatarUrl: data.avatarUrl,
      isActive: false
    })
  );

  // Create status filters with colors
  filtersState.dynamicFilters.status = mergeFilters(
    Array.from(statusMap.entries()),
    'status',
    (name, data) => ({
      id: makeFilterId('status', name),
      label: name,
      jqlCondition: `status = "${name}"`,
      category: 'status' as FilterCategory,
      icon: getStatusIcon(data.categoryKey),
      color:
        STATUS_CATEGORY_COLORS[data.colorName] ||
        STATUS_CATEGORY_COLORS[data.categoryKey] ||
        '#6B778C',
      isActive: false
    })
  );

  // Create type filters using iconUrl from JIRA API
  filtersState.dynamicFilters.type = mergeFilters(
    Array.from(typeMap.entries()),
    'type',
    (name, data) => ({
      id: makeFilterId('type', name),
      label: name,
      jqlCondition: `issuetype = ${data.id}`,
      category: 'type' as FilterCategory,
      iconUrl: data.iconUrl,
      isActive: false
    })
  );

  // Create assignee filters
  filtersState.dynamicFilters.assignee = mergeFilters(
    Array.from(assigneeMap.entries()),
    'assignee',
    (key, data) => {
      const jqlValue = data.accountId ? `"${data.accountId}"` : `"${data.name}"`;
      const colorIdentifier = data.accountId || data.emailAddress || data.displayName;
      return {
        id: `assignee-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        label: data.displayName,
        jqlCondition: `assignee = ${jqlValue}`,
        category: 'assignee' as FilterCategory,
        icon: 'person',
        avatarUrl: data.avatarUrl,
        color: getAvatarColor(colorIdentifier),
        isActive: false
      };
    }
  );

  // Create priority filters
  filtersState.dynamicFilters.priority = mergeFilters(
    Array.from(priorityMap.entries()),
    'priority',
    (name, data) => ({
      id: makeFilterId('priority', name),
      label: name,
      jqlCondition: `priority = "${name}"`,
      category: 'priority' as FilterCategory,
      iconUrl: data.iconUrl,
      isActive: false
    })
  );

  // Create resolution filters
  filtersState.dynamicFilters.resolution = mergeFilters(
    Array.from(resolutionMap.entries()),
    'resolution',
    (name, data) => ({
      id: makeFilterId('resolution', name),
      label: name,
      jqlCondition: `resolution = ${data.id}`,
      category: 'resolution' as FilterCategory,
      icon: 'check-circle',
      color: '#00875A',
      isActive: false
    })
  );

  // Create component filters
  filtersState.dynamicFilters.component = mergeFilters(
    Array.from(componentMap.entries()),
    'component',
    (name) => ({
      id: makeFilterId('component', name),
      label: name,
      jqlCondition: `component = "${name}"`,
      category: 'component' as FilterCategory,
      icon: 'component',
      isActive: false
    })
  );

  // Create fix version filters
  filtersState.dynamicFilters.fixVersion = mergeFilters(
    Array.from(fixVersionMap.entries()),
    'fixVersion',
    (name) => ({
      id: makeFilterId('fixversion', name),
      label: name,
      jqlCondition: `fixVersion = "${name}"`,
      category: 'fixVersion' as FilterCategory,
      icon: 'release',
      isActive: false
    })
  );

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
  // Clear active custom filter when manually changing filters
  if (filtersState.activeCustomFilterId) {
    filtersState.activeCustomFilterId = null;
  }

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

// ============================================
// Custom Filter Management (per-query)
// ============================================

// Import jql store functions for per-query storage
import {
  addQueryCustomFilter,
  updateQueryCustomFilter,
  deleteQueryCustomFilter,
  setQueryActiveCustomFilter,
  reorderQueryCustomFilters
} from './jql.svelte';
import { routerState } from './router.svelte';

/**
 * Load custom filters from a query into the UI state
 */
export function loadCustomFilters(
  customFilters?: CustomFilter[],
  activeCustomFilterId?: string | null
): void {
  filtersState.customFilters = customFilters || [];
  filtersState.activeCustomFilterId = activeCustomFilterId || null;
  logger.store('filters', 'Loaded custom filters from query', {
    count: filtersState.customFilters.length
  });
}

/**
 * Check if there are any active filters that can be saved
 */
export function hasActiveFiltersToSave(): boolean {
  const hasStaticFilters = filtersState.filters.some((f) => f.isActive);
  const hasDynamicFilters = getAllDynamicFiltersFlat().some((f) => f.isActive);
  const hasRecency = filtersState.recencyFilter !== null;
  const hasSearch = filtersState.searchText.trim().length > 0;
  return hasStaticFilters || hasDynamicFilters || hasRecency || hasSearch;
}

/**
 * Save current filter state as a custom filter (per-query)
 */
export function saveCustomFilter(name: string, icon?: CustomFilterIcon): CustomFilter | null {
  const queryId = routerState.activeQueryId;
  if (!queryId) {
    logger.warn('Cannot save custom filter: no active query');
    return null;
  }

  if (!name.trim()) {
    logger.warn('Cannot save custom filter: name is empty');
    return null;
  }

  // Collect all active filter IDs
  const activeStaticFilterIds = filtersState.filters.filter((f) => f.isActive).map((f) => f.id);
  const activeDynamicFilterIds = getAllDynamicFiltersFlat()
    .filter((f) => f.isActive)
    .map((f) => f.id);

  const filterIds = [...activeStaticFilterIds, ...activeDynamicFilterIds];

  // Save to jql store (persisted with query)
  const customFilter = addQueryCustomFilter(
    queryId,
    name,
    filterIds,
    filtersState.recencyFilter,
    filtersState.searchText,
    icon
  );

  if (customFilter) {
    // Update local UI state
    filtersState.customFilters = [...filtersState.customFilters, customFilter];
  }

  return customFilter;
}

/**
 * Delete a custom filter by ID (per-query)
 */
export function deleteCustomFilter(id: string): void {
  const queryId = routerState.activeQueryId;
  if (!queryId) {
    logger.warn('Cannot delete custom filter: no active query');
    return;
  }

  // Delete from jql store
  deleteQueryCustomFilter(queryId, id);

  // Update local UI state
  filtersState.customFilters = filtersState.customFilters.filter((f) => f.id !== id);
  if (filtersState.activeCustomFilterId === id) {
    filtersState.activeCustomFilterId = null;
  }
}

/**
 * Update a custom filter (name and/or icon) - per-query
 */
export function updateCustomFilter(id: string, newName: string, icon?: CustomFilterIcon): void {
  const queryId = routerState.activeQueryId;
  if (!queryId) {
    logger.warn('Cannot update custom filter: no active query');
    return;
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    logger.warn('Cannot update custom filter: name is empty');
    return;
  }

  // Update in jql store
  updateQueryCustomFilter(queryId, id, trimmedName, icon);

  // Update local UI state
  filtersState.customFilters = filtersState.customFilters.map((f) =>
    f.id === id ? { ...f, name: trimmedName, icon } : f
  );
}

/**
 * Reorder custom filters
 */
export function reorderCustomFilters(fromIndex: number, toIndex: number): void {
  const queryId = routerState.activeQueryId;
  if (!queryId) {
    logger.warn('Cannot reorder custom filters: no active query');
    return;
  }

  if (fromIndex < 0 || fromIndex >= filtersState.customFilters.length) return;
  if (toIndex < 0 || toIndex >= filtersState.customFilters.length) return;

  // Update in jql store (persists to storage)
  reorderQueryCustomFilters(queryId, fromIndex, toIndex);

  // Update local UI state
  const newFilters = [...filtersState.customFilters];
  const [removed] = newFilters.splice(fromIndex, 1);
  newFilters.splice(toIndex, 0, removed);
  filtersState.customFilters = newFilters;

  logger.store('filters', 'Reordered custom filters', { fromIndex, toIndex });
}

/**
 * Apply a custom filter (activate all its saved filters)
 */
export function applyCustomFilter(id: string): void {
  const queryId = routerState.activeQueryId;
  const customFilter = filtersState.customFilters.find((f) => f.id === id);
  if (!customFilter) {
    logger.warn('Custom filter not found', { id });
    return;
  }

  // If already active, deactivate it (toggle off)
  if (filtersState.activeCustomFilterId === id) {
    resetFilters();
    if (queryId) {
      setQueryActiveCustomFilter(queryId, null);
    }
    return;
  }

  // Clear all current filters first
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  clearAllDynamicFilters();

  // Apply saved filter IDs
  const savedIds = new Set(customFilter.filterIds);

  // Activate static filters
  filtersState.filters = filtersState.filters.map((f) => ({
    ...f,
    isActive: savedIds.has(f.id)
  }));

  // Activate dynamic filters
  setActiveStateByIds(savedIds);

  // Apply recency filter
  filtersState.recencyFilter = customFilter.recencyFilter;

  // Apply search text
  filtersState.searchText = customFilter.searchText;

  // Mark this custom filter as active
  filtersState.activeCustomFilterId = id;

  // Persist active custom filter to query
  if (queryId) {
    setQueryActiveCustomFilter(queryId, id);
  }

  logger.store('filters', 'Applied custom filter', {
    name: customFilter.name,
    filterCount: customFilter.filterIds.length
  });

  notifyFiltersChange();
}

// ============================================
// Filter ID to JQL Conversion (for auto-refresh)
// ============================================

// Mapping from category to filter ID prefix (handles naming inconsistencies)
const CATEGORY_PREFIX: Record<DynamicFilterCategory, string> = {
  project: 'project',
  status: 'status',
  type: 'type',
  assignee: 'assignee',
  priority: 'priority',
  resolution: 'resolution',
  component: 'component',
  fixVersion: 'fixversion' // prefix is lowercase
};

/**
 * Convert a filter ID back to a JQL value (best effort)
 * Handles special cases for project (uppercase key) and assignee (raw value)
 */
function filterIdToJqlValue(id: string, prefix: string, category: DynamicFilterCategory): string {
  const valuePart = id.slice(prefix.length + 1); // +1 for the hyphen

  if (category === 'project') {
    return `"${valuePart.toUpperCase()}"`;
  }
  if (category === 'assignee') {
    return `"${valuePart}"`;
  }

  // Convert kebab-case back to Title Case for other categories
  const name = valuePart
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return `"${name}"`;
}

/**
 * Convert saved filter IDs to JQL conditions
 * Used by auto-refresh to get counts with filters applied
 */
export function filterIdsToJqlConditions(filterIds: string[]): string[] {
  const conditions: string[] = [];
  const categoryValues: Record<DynamicFilterCategory, string[]> = {
    project: [],
    status: [],
    type: [],
    assignee: [],
    priority: [],
    resolution: [],
    component: [],
    fixVersion: []
  };

  for (const id of filterIds) {
    // Recency filters
    if (id.startsWith('recency-')) {
      const option = RECENCY_FILTER_OPTIONS.find((o) => o.id === id.slice(8));
      if (option?.jqlCondition) conditions.push(option.jqlCondition);
      continue;
    }

    // Static filters
    const staticFilter = DEFAULT_QUICK_FILTERS.find((f) => f.id === id);
    if (staticFilter) {
      conditions.push(staticFilter.jqlCondition);
      continue;
    }

    // Dynamic filters - find matching category
    for (const category of DYNAMIC_FILTER_CATEGORIES) {
      const prefix = CATEGORY_PREFIX[category];
      if (id.startsWith(`${prefix}-`)) {
        categoryValues[category].push(filterIdToJqlValue(id, prefix, category));
        break;
      }
    }
  }

  // Build JQL for each category (uses DYNAMIC_FILTER_CONFIG for jqlField)
  for (const category of DYNAMIC_FILTER_CATEGORIES) {
    const values = categoryValues[category];
    if (values.length === 0) continue;

    const { jqlField } = DYNAMIC_FILTER_CONFIG[category];
    conditions.push(
      values.length === 1 ? `${jqlField} = ${values[0]}` : `${jqlField} IN (${values.join(', ')})`
    );
  }

  return conditions;
}
