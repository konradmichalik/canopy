/**
 * Router Store
 * Simple client-side routing with Svelte 5 Runes
 */

import type { Screen, RouterState } from '../types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container object
export const routerState = $state<RouterState>({
  currentScreen: 'dashboard',
  activeQueryId: null
});

/**
 * Navigate to dashboard
 */
export function navigateToDashboard(): void {
  routerState.currentScreen = 'dashboard';
  routerState.activeQueryId = null;
  logger.store('router', 'Navigate to dashboard');
}

/**
 * Navigate to tree view with a specific query
 */
export function navigateToTree(queryId: string): void {
  routerState.currentScreen = 'tree';
  routerState.activeQueryId = queryId;
  setStorageItem(STORAGE_KEYS.LAST_QUERY_ID, queryId);
  logger.store('router', 'Navigate to tree', { queryId });
}

/**
 * Get current router state
 */
export function getRouterState(): RouterState {
  return routerState;
}

/**
 * Initialize router (restore last query if available)
 */
export function initializeRouter(): void {
  const lastQueryId = getStorageItem<string>(STORAGE_KEYS.LAST_QUERY_ID);
  if (lastQueryId) {
    routerState.activeQueryId = lastQueryId;
    logger.store('router', 'Restored last query ID', { queryId: lastQueryId });
  }
}

/**
 * Check if on dashboard
 */
export function isDashboard(): boolean {
  return routerState.currentScreen === 'dashboard';
}

/**
 * Check if on tree view
 */
export function isTreeView(): boolean {
  return routerState.currentScreen === 'tree';
}
