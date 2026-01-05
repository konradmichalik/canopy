/**
 * Router Store
 * Simple client-side state management with Svelte 5 Runes
 */

import type { RouterState } from '../types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;

// State container object
export const routerState = $state<RouterState>({
  activeQueryId: null,
  sidebarOpen: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH
});

/**
 * Toggle sidebar open/closed
 */
export function toggleSidebar(): void {
  routerState.sidebarOpen = !routerState.sidebarOpen;
  setStorageItem(STORAGE_KEYS.SIDEBAR_OPEN, routerState.sidebarOpen);
  logger.store('router', 'Toggle sidebar', { open: routerState.sidebarOpen });
}

/**
 * Set sidebar width (clamped to min/max)
 */
export function setSidebarWidth(width: number): void {
  routerState.sidebarWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
  setStorageItem(STORAGE_KEYS.SIDEBAR_WIDTH, routerState.sidebarWidth);
  logger.store('router', 'Set sidebar width', { width: routerState.sidebarWidth });
}

/**
 * Set active query
 */
export function setActiveQuery(queryId: string): void {
  routerState.activeQueryId = queryId;
  setStorageItem(STORAGE_KEYS.LAST_QUERY_ID, queryId);
  logger.store('router', 'Set active query', { queryId });
}

/**
 * Clear active query
 */
export function clearActiveQuery(): void {
  routerState.activeQueryId = null;
  logger.store('router', 'Clear active query');
}

/**
 * Get current router state
 */
export function getRouterState(): RouterState {
  return routerState;
}

/**
 * Initialize router (restore state from localStorage)
 */
export function initializeRouter(): void {
  const lastQueryId = getStorageItem<string>(STORAGE_KEYS.LAST_QUERY_ID);
  const sidebarOpen = getStorageItem<boolean>(STORAGE_KEYS.SIDEBAR_OPEN);
  const sidebarWidth = getStorageItem<number>(STORAGE_KEYS.SIDEBAR_WIDTH);

  if (lastQueryId) {
    routerState.activeQueryId = lastQueryId;
    logger.store('router', 'Restored last query ID', { queryId: lastQueryId });
  }

  if (sidebarOpen !== null) {
    routerState.sidebarOpen = sidebarOpen;
    logger.store('router', 'Restored sidebar open state', { open: sidebarOpen });
  }

  if (sidebarWidth !== null) {
    routerState.sidebarWidth = Math.max(
      MIN_SIDEBAR_WIDTH,
      Math.min(MAX_SIDEBAR_WIDTH, sidebarWidth)
    );
    logger.store('router', 'Restored sidebar width', { width: routerState.sidebarWidth });
  }
}

// Export constants for use in components
export { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH };
