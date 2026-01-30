/**
 * Sort Configuration Store
 * Manages the sorting configuration for issue tree display
 * Configuration is stored per query
 */

import { logger } from '../utils/logger';
import {
  DEFAULT_SORT_CONFIG,
  SORT_FIELDS,
  type SortConfig,
  type SortField,
  type SortDirection
} from '../types/tree';
import { getDefaultSortConfig } from './defaultSort.svelte';

// ============================================
// Types
// ============================================

export interface SortConfigState {
  config: SortConfig;
  currentQueryId: string | null;
}

// ============================================
// Callbacks for sort config changes
// ============================================

const sortConfigChangeCallbacks: Array<(config: SortConfig) => void> = [];

export function setSortConfigChangeCallback(callback: (config: SortConfig) => void): void {
  // Avoid duplicate callbacks
  if (!sortConfigChangeCallbacks.includes(callback)) {
    sortConfigChangeCallbacks.push(callback);
  }
}

// ============================================
// State
// ============================================

export const sortConfigState: SortConfigState = $state({
  config: { ...DEFAULT_SORT_CONFIG },
  currentQueryId: null
});

// ============================================
// Actions
// ============================================

/**
 * Load sort configuration for a query
 */
export function loadSortConfig(queryId: string, sortConfig?: SortConfig): void {
  sortConfigState.config = sortConfig || getDefaultSortConfig();
  sortConfigState.currentQueryId = queryId;
  logger.debug('Sort config loaded for query', { queryId, sortConfig: sortConfigState.config });
}

/**
 * Initialize sort configuration with defaults
 */
export function initializeSortConfig(): void {
  sortConfigState.config = getDefaultSortConfig();
  sortConfigState.currentQueryId = null;
  logger.debug('Sort config initialized with defaults');
}

/**
 * Set sort field
 */
export function setSortField(field: SortField): void {
  if (sortConfigState.config.field !== field) {
    sortConfigState.config = { ...sortConfigState.config, field };
    notifyChange();
    logger.debug(`Sort field set to "${field}"`);
  }
}

/**
 * Set sort direction
 */
export function setSortDirection(direction: SortDirection): void {
  if (sortConfigState.config.direction !== direction) {
    sortConfigState.config = { ...sortConfigState.config, direction };
    notifyChange();
    logger.debug(`Sort direction set to "${direction}"`);
  }
}

/**
 * Toggle sort direction
 */
export function toggleSortDirection(): void {
  const newDirection = sortConfigState.config.direction === 'asc' ? 'desc' : 'asc';
  setSortDirection(newDirection);
}

/**
 * Set full sort configuration
 */
export function setSortConfig(config: SortConfig): void {
  sortConfigState.config = { ...config };
  notifyChange();
  logger.debug('Sort config set', config);
}

/**
 * Get current sort configuration
 */
export function getSortConfig(): SortConfig {
  return { ...sortConfigState.config };
}

/**
 * Reset to default configuration
 */
export function resetSortConfig(): void {
  sortConfigState.config = getDefaultSortConfig();
  notifyChange();
  logger.info('Sort config reset to defaults');
}

// ============================================
// Exports for UI
// ============================================

export { SORT_FIELDS, DEFAULT_SORT_CONFIG };

// ============================================
// Internal
// ============================================

function notifyChange(): void {
  const config = getSortConfig();
  for (const callback of sortConfigChangeCallbacks) {
    callback(config);
  }
}
