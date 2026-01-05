/**
 * Filters Store
 * Manages quick filter state
 */

import type { JiraIssue, QuickFilter } from '../types';
import {
  DEFAULT_QUICK_FILTERS,
  type FilterCategory,
  type QuickFilterDefinition
} from '../types/tree';
import { logger } from '../utils/logger';

// Callback for when filters change - set by issues store
let onFiltersChange: (() => void) | null = null;

// Callback to persist active filter changes to query
let onActiveFiltersChange: ((activeFilterIds: string[]) => void) | null = null;

export function setFiltersChangeCallback(callback: () => void): void {
  onFiltersChange = callback;
}

export function setActiveFiltersChangeCallback(callback: (activeFilterIds: string[]) => void): void {
  onActiveFiltersChange = callback;
}

function notifyFiltersChange(): void {
  if (onFiltersChange) {
    onFiltersChange();
  }
  // Also notify about active filter IDs for persistence
  if (onActiveFiltersChange) {
    onActiveFiltersChange(getActiveFilterIds());
  }
}

/**
 * Get all active filter IDs for persistence
 */
export function getActiveFilterIds(): string[] {
  return getActiveFilters().map((f) => f.id);
}

/**
 * Load active filters from saved filter IDs
 * Called when switching queries to restore filter state
 * Sets up pending filter IDs that will be applied after dynamic filters are generated
 */
export function loadActiveFilters(activeFilterIds?: string[]): void {
  // Clear all filters first
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  filtersState.dynamicStatusFilters = filtersState.dynamicStatusFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicTypeFilters = filtersState.dynamicTypeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicAssigneeFilters = filtersState.dynamicAssigneeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicPriorityFilters = filtersState.dynamicPriorityFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicResolutionFilters = filtersState.dynamicResolutionFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicComponentFilters = filtersState.dynamicComponentFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicFixVersionFilters = filtersState.dynamicFixVersionFilters.map((f) => ({
    ...f,
    isActive: false
  }));

  // If no active filters to restore, clear pending and we're done
  if (!activeFilterIds || activeFilterIds.length === 0) {
    filtersState.pendingActiveFilterIds = null;
    logger.debug('Filters cleared for new query');
    return;
  }

  // Store pending filter IDs for restoration after dynamic filters are generated
  filtersState.pendingActiveFilterIds = activeFilterIds;

  // Apply to static filters immediately
  const activeIds = new Set(activeFilterIds);
  filtersState.filters = filtersState.filters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));

  logger.debug('Static filters loaded, dynamic filters pending', { activeFilterIds });
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

  filtersState.dynamicStatusFilters = filtersState.dynamicStatusFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicTypeFilters = filtersState.dynamicTypeFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicAssigneeFilters = filtersState.dynamicAssigneeFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicPriorityFilters = filtersState.dynamicPriorityFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicResolutionFilters = filtersState.dynamicResolutionFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicComponentFilters = filtersState.dynamicComponentFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));
  filtersState.dynamicFixVersionFilters = filtersState.dynamicFixVersionFilters.map((f) => ({
    ...f,
    isActive: activeIds.has(f.id)
  }));

  logger.debug('Dynamic filters restored from pending', {
    pendingFilterIds: filtersState.pendingActiveFilterIds
  });

  // Clear pending
  filtersState.pendingActiveFilterIds = null;
}

// Extended filter type with category
export interface ExtendedQuickFilter extends QuickFilter {
  category: FilterCategory;
  icon?: string;
  color?: string; // Color from JIRA API (e.g., statusCategory.colorName)
  avatarUrl?: string; // Avatar URL for assignee filters
}

// Icon mapping for issue types
const TYPE_ICONS: Record<string, string> = {
  Epic: 'zap',
  Story: 'book-open',
  Task: 'check-square',
  Bug: 'bug',
  'Sub-task': 'check-square',
  Subtask: 'check-square'
};

// State container object
export const filtersState = $state({
  filters: DEFAULT_QUICK_FILTERS.map((f) => ({ ...f, isActive: false })) as ExtendedQuickFilter[],
  dynamicStatusFilters: [] as ExtendedQuickFilter[],
  dynamicTypeFilters: [] as ExtendedQuickFilter[],
  dynamicAssigneeFilters: [] as ExtendedQuickFilter[],
  dynamicPriorityFilters: [] as ExtendedQuickFilter[],
  dynamicResolutionFilters: [] as ExtendedQuickFilter[],
  dynamicComponentFilters: [] as ExtendedQuickFilter[],
  dynamicFixVersionFilters: [] as ExtendedQuickFilter[],
  // Temporarily stores filter IDs to restore after dynamic filters are generated
  pendingActiveFilterIds: null as string[] | null
});

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
  return [
    ...filtersState.filters.filter((f) => f.isActive),
    ...filtersState.dynamicStatusFilters.filter((f) => f.isActive),
    ...filtersState.dynamicTypeFilters.filter((f) => f.isActive),
    ...filtersState.dynamicAssigneeFilters.filter((f) => f.isActive),
    ...filtersState.dynamicPriorityFilters.filter((f) => f.isActive),
    ...filtersState.dynamicResolutionFilters.filter((f) => f.isActive),
    ...filtersState.dynamicComponentFilters.filter((f) => f.isActive),
    ...filtersState.dynamicFixVersionFilters.filter((f) => f.isActive)
  ];
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
 * Clear all filters (including dynamic ones) and persist the change
 */
export function resetFilters(): void {
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  filtersState.dynamicStatusFilters = filtersState.dynamicStatusFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicTypeFilters = filtersState.dynamicTypeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicAssigneeFilters = filtersState.dynamicAssigneeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicPriorityFilters = filtersState.dynamicPriorityFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicResolutionFilters = filtersState.dynamicResolutionFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicComponentFilters = filtersState.dynamicComponentFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicFixVersionFilters = filtersState.dynamicFixVersionFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  logger.store('filters', 'Reset all filters');
  notifyFiltersChange();
}

/**
 * Clear all filters (including dynamic ones) - internal use, does not persist
 */
export function clearFilters(): void {
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
  filtersState.dynamicStatusFilters = filtersState.dynamicStatusFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicTypeFilters = filtersState.dynamicTypeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicAssigneeFilters = filtersState.dynamicAssigneeFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicPriorityFilters = filtersState.dynamicPriorityFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicResolutionFilters = filtersState.dynamicResolutionFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicComponentFilters = filtersState.dynamicComponentFilters.map((f) => ({
    ...f,
    isActive: false
  }));
  filtersState.dynamicFixVersionFilters = filtersState.dynamicFixVersionFilters.map((f) => ({
    ...f,
    isActive: false
  }));
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
 * Get JQL conditions from active filters
 * Filters within the same category (status, type, assignee, etc.) are combined with OR
 * Different categories are combined with AND
 */
export function getActiveFilterConditions(): string[] {
  const activeFilters = getActiveFilters() as ExtendedQuickFilter[];
  const conditions: string[] = [];

  // Group filters by category
  const statusFilters = activeFilters.filter((f) => f.category === 'status');
  const typeFilters = activeFilters.filter((f) => f.category === 'type');
  const assigneeFilters = activeFilters.filter((f) => f.category === 'assignee');
  const priorityFilters = activeFilters.filter((f) => f.category === 'priority');
  const resolutionFilters = activeFilters.filter((f) => f.category === 'resolution');
  const componentFilters = activeFilters.filter((f) => f.category === 'component');
  const fixVersionFilters = activeFilters.filter((f) => f.category === 'fixVersion');
  const otherFilters = activeFilters.filter(
    (f) =>
      f.category !== 'status' &&
      f.category !== 'type' &&
      f.category !== 'assignee' &&
      f.category !== 'priority' &&
      f.category !== 'resolution' &&
      f.category !== 'component' &&
      f.category !== 'fixVersion'
  );

  // Build OR-combined conditions for status filters
  if (statusFilters.length === 1) {
    conditions.push(statusFilters[0].jqlCondition);
  } else if (statusFilters.length > 1) {
    const statusNames = statusFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`status IN (${statusNames})`);
  }

  // Build OR-combined conditions for type filters
  if (typeFilters.length === 1) {
    conditions.push(typeFilters[0].jqlCondition);
  } else if (typeFilters.length > 1) {
    const typeNames = typeFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`issuetype IN (${typeNames})`);
  }

  // Build OR-combined conditions for assignee filters
  if (assigneeFilters.length === 1) {
    conditions.push(assigneeFilters[0].jqlCondition);
  } else if (assigneeFilters.length > 1) {
    // Combine assignee conditions with OR
    const assigneeConditions = assigneeFilters.map((f) => f.jqlCondition).join(' OR ');
    conditions.push(`(${assigneeConditions})`);
  }

  // Build OR-combined conditions for priority filters
  if (priorityFilters.length === 1) {
    conditions.push(priorityFilters[0].jqlCondition);
  } else if (priorityFilters.length > 1) {
    const priorityNames = priorityFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`priority IN (${priorityNames})`);
  }

  // Build OR-combined conditions for resolution filters
  if (resolutionFilters.length === 1) {
    conditions.push(resolutionFilters[0].jqlCondition);
  } else if (resolutionFilters.length > 1) {
    const resolutionNames = resolutionFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`resolution IN (${resolutionNames})`);
  }

  // Build OR-combined conditions for component filters
  if (componentFilters.length === 1) {
    conditions.push(componentFilters[0].jqlCondition);
  } else if (componentFilters.length > 1) {
    const componentNames = componentFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`component IN (${componentNames})`);
  }

  // Build OR-combined conditions for fixVersion filters
  if (fixVersionFilters.length === 1) {
    conditions.push(fixVersionFilters[0].jqlCondition);
  } else if (fixVersionFilters.length > 1) {
    const versionNames = fixVersionFilters.map((f) => `"${f.label}"`).join(', ');
    conditions.push(`fixVersion IN (${versionNames})`);
  }

  // Add other filters (general category) as individual AND conditions
  for (const filter of otherFilters) {
    conditions.push(filter.jqlCondition);
  }

  return conditions;
}

/**
 * Get all filters including dynamic ones
 */
export function getAllFilters(): ExtendedQuickFilter[] {
  return [
    ...filtersState.filters,
    ...filtersState.dynamicStatusFilters,
    ...filtersState.dynamicTypeFilters,
    ...filtersState.dynamicAssigneeFilters,
    ...filtersState.dynamicPriorityFilters,
    ...filtersState.dynamicResolutionFilters,
    ...filtersState.dynamicComponentFilters,
    ...filtersState.dynamicFixVersionFilters
  ];
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
  const statusMap = new Map<string, { name: string; categoryKey: string; colorName: string }>();
  const typeMap = new Map<string, { name: string; iconUrl?: string }>();
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
  const resolutionMap = new Map<string, { name: string }>();
  const componentMap = new Map<string, { name: string }>();
  const fixVersionMap = new Map<string, { name: string }>();

  for (const issue of issues) {
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

  // Preserve active state of existing filters
  const activeStatusIds = new Set(
    filtersState.dynamicStatusFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeTypeIds = new Set(
    filtersState.dynamicTypeFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeAssigneeIds = new Set(
    filtersState.dynamicAssigneeFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activePriorityIds = new Set(
    filtersState.dynamicPriorityFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeResolutionIds = new Set(
    filtersState.dynamicResolutionFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeComponentIds = new Set(
    filtersState.dynamicComponentFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeFixVersionIds = new Set(
    filtersState.dynamicFixVersionFilters.filter((f) => f.isActive).map((f) => f.id)
  );

  // Create status filters with colors
  filtersState.dynamicStatusFilters = Array.from(statusMap.entries()).map(([name, data]) => ({
    id: `status-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `status = "${name}"`,
    category: 'status' as FilterCategory,
    icon: getStatusIcon(data.categoryKey),
    color:
      STATUS_CATEGORY_COLORS[data.colorName] ||
      STATUS_CATEGORY_COLORS[data.categoryKey] ||
      '#6B778C',
    isActive: activeStatusIds.has(`status-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  // Create type filters
  filtersState.dynamicTypeFilters = Array.from(typeMap.entries()).map(([name, data]) => ({
    id: `type-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `issuetype = "${name}"`,
    category: 'type' as FilterCategory,
    icon: TYPE_ICONS[name] || 'circle',
    isActive: activeTypeIds.has(`type-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  // Create assignee filters sorted by display name
  const sortedAssignees = Array.from(assigneeMap.entries()).sort((a, b) =>
    a[1].displayName.localeCompare(b[1].displayName)
  );

  filtersState.dynamicAssigneeFilters = sortedAssignees.map(([key, data]) => {
    const filterId = `assignee-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const jqlValue = data.accountId ? `"${data.accountId}"` : `"${data.name}"`;
    const colorIdentifier = data.accountId || data.emailAddress || data.displayName;
    return {
      id: filterId,
      label: data.displayName,
      jqlCondition: `assignee = ${jqlValue}`,
      category: 'assignee' as FilterCategory,
      icon: 'user',
      avatarUrl: data.avatarUrl,
      color: getAvatarColor(colorIdentifier),
      isActive: activeAssigneeIds.has(filterId)
    };
  });

  // Create priority filters sorted by name
  const sortedPriorities = Array.from(priorityMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicPriorityFilters = sortedPriorities.map(([name, data]) => ({
    id: `priority-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `priority = "${name}"`,
    category: 'priority' as FilterCategory,
    icon: 'alert-triangle',
    isActive: activePriorityIds.has(`priority-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  // Create resolution filters sorted by name
  const sortedResolutions = Array.from(resolutionMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicResolutionFilters = sortedResolutions.map(([name]) => ({
    id: `resolution-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `resolution = "${name}"`,
    category: 'resolution' as FilterCategory,
    icon: 'check-circle',
    color: '#00875A',
    isActive: activeResolutionIds.has(`resolution-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  // Create component filters sorted by name
  const sortedComponents = Array.from(componentMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicComponentFilters = sortedComponents.map(([name]) => ({
    id: `component-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `component = "${name}"`,
    category: 'component' as FilterCategory,
    icon: 'puzzle',
    isActive: activeComponentIds.has(`component-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  // Create fix version filters sorted by name
  const sortedFixVersions = Array.from(fixVersionMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  filtersState.dynamicFixVersionFilters = sortedFixVersions.map(([name]) => ({
    id: `fixversion-${name.toLowerCase().replace(/\s+/g, '-')}`,
    label: name,
    jqlCondition: `fixVersion = "${name}"`,
    category: 'fixVersion' as FilterCategory,
    icon: 'package',
    isActive: activeFixVersionIds.has(`fixversion-${name.toLowerCase().replace(/\s+/g, '-')}`)
  }));

  logger.store('filters', 'Updated dynamic filters', {
    statuses: filtersState.dynamicStatusFilters.length,
    types: filtersState.dynamicTypeFilters.length,
    assignees: filtersState.dynamicAssigneeFilters.length,
    priorities: filtersState.dynamicPriorityFilters.length,
    resolutions: filtersState.dynamicResolutionFilters.length,
    components: filtersState.dynamicComponentFilters.length,
    fixVersions: filtersState.dynamicFixVersionFilters.length
  });

  // Apply pending active filters if any
  applyPendingActiveFilters();
}

/**
 * Get icon for status based on category
 */
function getStatusIcon(categoryKey: string): string {
  switch (categoryKey) {
    case 'new':
    case 'undefined':
      return 'circle-dot';
    case 'indeterminate':
      return 'loader';
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
  // Check if it's a status filter
  const statusIndex = filtersState.dynamicStatusFilters.findIndex((f) => f.id === id);
  if (statusIndex !== -1) {
    filtersState.dynamicStatusFilters = filtersState.dynamicStatusFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic status filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's a type filter
  const typeIndex = filtersState.dynamicTypeFilters.findIndex((f) => f.id === id);
  if (typeIndex !== -1) {
    filtersState.dynamicTypeFilters = filtersState.dynamicTypeFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic type filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's an assignee filter
  const assigneeIndex = filtersState.dynamicAssigneeFilters.findIndex((f) => f.id === id);
  if (assigneeIndex !== -1) {
    filtersState.dynamicAssigneeFilters = filtersState.dynamicAssigneeFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic assignee filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's a priority filter
  const priorityIndex = filtersState.dynamicPriorityFilters.findIndex((f) => f.id === id);
  if (priorityIndex !== -1) {
    filtersState.dynamicPriorityFilters = filtersState.dynamicPriorityFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic priority filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's a resolution filter
  const resolutionIndex = filtersState.dynamicResolutionFilters.findIndex((f) => f.id === id);
  if (resolutionIndex !== -1) {
    filtersState.dynamicResolutionFilters = filtersState.dynamicResolutionFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic resolution filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's a component filter
  const componentIndex = filtersState.dynamicComponentFilters.findIndex((f) => f.id === id);
  if (componentIndex !== -1) {
    filtersState.dynamicComponentFilters = filtersState.dynamicComponentFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic component filter', { id });
    notifyFiltersChange();
    return;
  }

  // Check if it's a fix version filter
  const fixVersionIndex = filtersState.dynamicFixVersionFilters.findIndex((f) => f.id === id);
  if (fixVersionIndex !== -1) {
    filtersState.dynamicFixVersionFilters = filtersState.dynamicFixVersionFilters.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    logger.store('filters', 'Toggle dynamic fix version filter', { id });
    notifyFiltersChange();
    return;
  }

  // Otherwise, toggle regular filter
  toggleFilter(id);
}
