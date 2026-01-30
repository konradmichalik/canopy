/**
 * Auto-Expand Depth Store
 * Controls how many levels of the tree are auto-expanded on load
 */

import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type AutoExpandDepthValue = 0 | 1 | 2 | -1;

export const AUTO_EXPAND_OPTIONS: { value: AutoExpandDepthValue; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 1, label: '1 Level' },
  { value: 2, label: '2 Levels' },
  { value: -1, label: 'All' }
];

// State container
export const autoExpandDepthState = $state({
  depth: 0 as AutoExpandDepthValue
});

/**
 * Initialize auto-expand depth from storage
 */
export async function initializeAutoExpandDepth(): Promise<void> {
  const stored = await getStorageItemAsync<AutoExpandDepthValue>(STORAGE_KEYS.AUTO_EXPAND_DEPTH);
  if (stored !== null && AUTO_EXPAND_OPTIONS.some((o) => o.value === stored)) {
    autoExpandDepthState.depth = stored;
  }

  logger.store('autoExpandDepth', 'Initialized', {
    depth: autoExpandDepthState.depth
  });
}

/**
 * Set auto-expand depth
 */
export function setAutoExpandDepth(depth: AutoExpandDepthValue): void {
  autoExpandDepthState.depth = depth;
  saveStorage(STORAGE_KEYS.AUTO_EXPAND_DEPTH, depth);
  logger.store('autoExpandDepth', 'Changed', { depth });
}

/**
 * Get current auto-expand depth
 */
export function getAutoExpandDepth(): AutoExpandDepthValue {
  return autoExpandDepthState.depth;
}
