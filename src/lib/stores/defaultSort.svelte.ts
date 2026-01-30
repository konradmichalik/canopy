/**
 * Default Sort Store
 * Global default sort configuration (used when creating new queries)
 */

import type { SortConfig, SortField, SortDirection } from '../types';
import { DEFAULT_SORT_CONFIG } from '../types';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container
export const defaultSortState = $state({
  config: { ...DEFAULT_SORT_CONFIG } as SortConfig
});

/**
 * Initialize default sort from storage
 */
export async function initializeDefaultSort(): Promise<void> {
  const stored = await getStorageItemAsync<SortConfig>(STORAGE_KEYS.DEFAULT_SORT);
  if (stored !== null && stored.field && stored.direction) {
    defaultSortState.config = stored;
  }

  logger.store('defaultSort', 'Initialized', {
    config: defaultSortState.config
  });
}

/**
 * Set default sort field
 */
export function setDefaultSortField(field: SortField): void {
  defaultSortState.config = { ...defaultSortState.config, field };
  saveStorage(STORAGE_KEYS.DEFAULT_SORT, defaultSortState.config);
  logger.store('defaultSort', 'Field changed', { field });
}

/**
 * Set default sort direction
 */
export function setDefaultSortDirection(direction: SortDirection): void {
  defaultSortState.config = { ...defaultSortState.config, direction };
  saveStorage(STORAGE_KEYS.DEFAULT_SORT, defaultSortState.config);
  logger.store('defaultSort', 'Direction changed', { direction });
}

/**
 * Get current default sort config
 */
export function getDefaultSortConfig(): SortConfig {
  return { ...defaultSortState.config };
}
