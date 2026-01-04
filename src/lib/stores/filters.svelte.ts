/**
 * Filters Store
 * Manages quick filter state
 */

import type { QuickFilter } from '../types';
import { DEFAULT_QUICK_FILTERS } from '../types/tree';
import { logger } from '../utils/logger';

// State container object
export const filtersState = $state({
  filters: DEFAULT_QUICK_FILTERS.map((f) => ({ ...f, isActive: false })) as QuickFilter[]
});

/**
 * Get all filters
 */
export function getFilters(): QuickFilter[] {
  return filtersState.filters;
}

/**
 * Get active filters
 */
export function getActiveFilters(): QuickFilter[] {
  return filtersState.filters.filter((f) => f.isActive);
}

/**
 * Toggle a filter by ID
 */
export function toggleFilter(id: string): void {
  filtersState.filters = filtersState.filters.map((f) =>
    f.id === id ? { ...f, isActive: !f.isActive } : f
  );
  logger.store('filters', 'Toggle filter', { id, isActive: filtersState.filters.find((f) => f.id === id)?.isActive });
}

/**
 * Set filter state
 */
export function setFilter(id: string, isActive: boolean): void {
  filtersState.filters = filtersState.filters.map((f) =>
    f.id === id ? { ...f, isActive } : f
  );
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
 */
export function getActiveFilterConditions(): string[] {
  return getActiveFilters().map((f) => f.jqlCondition);
}

