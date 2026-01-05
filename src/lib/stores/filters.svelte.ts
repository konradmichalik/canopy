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

export function setFiltersChangeCallback(callback: () => void): void {
  onFiltersChange = callback;
}

function notifyFiltersChange(): void {
  if (onFiltersChange) {
    onFiltersChange();
  }
}

// Extended filter type with category
export interface ExtendedQuickFilter extends QuickFilter {
  category: FilterCategory;
  icon?: string;
  color?: string; // Color from JIRA API (e.g., statusCategory.colorName)
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
  dynamicTypeFilters: [] as ExtendedQuickFilter[]
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
    ...filtersState.dynamicTypeFilters.filter((f) => f.isActive)
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
 * Clear all filters
 */
export function clearFilters(): void {
  filtersState.filters = filtersState.filters.map((f) => ({ ...f, isActive: false }));
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
 * All filters are combined with AND
 */
export function getActiveFilterConditions(): string[] {
  return getActiveFilters().map((f) => f.jqlCondition);
}

/**
 * Get all filters including dynamic ones
 */
export function getAllFilters(): ExtendedQuickFilter[] {
  return [
    ...filtersState.filters,
    ...filtersState.dynamicStatusFilters,
    ...filtersState.dynamicTypeFilters
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

/**
 * Update dynamic filters based on loaded issues
 */
export function updateDynamicFilters(issues: JiraIssue[]): void {
  // Extract unique statuses with color info
  const statusMap = new Map<string, { name: string; categoryKey: string; colorName: string }>();
  const typeMap = new Map<string, { name: string; iconUrl?: string }>();

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
  }

  // Preserve active state of existing filters
  const activeStatusIds = new Set(
    filtersState.dynamicStatusFilters.filter((f) => f.isActive).map((f) => f.id)
  );
  const activeTypeIds = new Set(
    filtersState.dynamicTypeFilters.filter((f) => f.isActive).map((f) => f.id)
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

  logger.store('filters', 'Updated dynamic filters', {
    statuses: filtersState.dynamicStatusFilters.map((s) => ({ name: s.label, color: s.color })),
    types: filtersState.dynamicTypeFilters.length
  });
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

  // Otherwise, toggle regular filter
  toggleFilter(id);
}
