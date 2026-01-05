/**
 * Debug Mode Store
 * Manages debug/developer features visibility with Svelte 5 Runes
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container
export const debugModeState = $state({
  enabled: false
});

/**
 * Initialize debug mode from storage
 */
export function initializeDebugMode(): void {
  const stored = getStorageItem<boolean>(STORAGE_KEYS.DEBUG_MODE);
  if (stored !== null) {
    debugModeState.enabled = stored;
  }

  logger.store('debugMode', 'Initialized', {
    enabled: debugModeState.enabled
  });
}

/**
 * Set debug mode
 */
export function setDebugMode(enabled: boolean): void {
  debugModeState.enabled = enabled;
  setStorageItem(STORAGE_KEYS.DEBUG_MODE, enabled);
  logger.store('debugMode', 'Changed', { enabled });
}

/**
 * Toggle debug mode
 */
export function toggleDebugMode(): void {
  setDebugMode(!debugModeState.enabled);
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugModeState.enabled;
}
