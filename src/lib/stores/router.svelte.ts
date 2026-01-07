/**
 * Router Store
 * Simple client-side state management with Svelte 5 Runes
 * Supports URL-based query routing with slugs (e.g., /query/my-sprint-board)
 */

import type { RouterState } from '../types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

const QUERY_PATH_PREFIX = '/query/';

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
 * Update URL with query slug path
 */
function updateUrl(slug: string | null): void {
  const url = new URL(window.location.href);

  if (slug) {
    url.pathname = QUERY_PATH_PREFIX + slug;
  } else {
    url.pathname = '/';
  }

  // Clear any query params when navigating
  url.search = '';

  window.history.pushState({ slug }, '', url.toString());
}

/**
 * Get query slug from current URL path
 */
export function getSlugFromUrl(): string | null {
  const pathname = window.location.pathname;

  if (pathname.startsWith(QUERY_PATH_PREFIX)) {
    const slug = pathname.slice(QUERY_PATH_PREFIX.length);
    return slug || null;
  }

  return null;
}

/**
 * Set active query
 * @param queryId - The query ID to set as active (null to clear)
 * @param slug - The URL slug (only needed when updating URL)
 * @param updateUrlPath - Whether to update the URL (default: true)
 */
export function setActiveQuery(
  queryId: string | null,
  slug?: string,
  updateUrlPath: boolean = true
): void {
  routerState.activeQueryId = queryId;

  if (queryId) {
    setStorageItem(STORAGE_KEYS.LAST_QUERY_ID, queryId);
  }

  if (updateUrlPath) {
    updateUrl(slug ?? null);
  }

  logger.store('router', 'Set active query', { queryId, slug, updateUrlPath });
}

/**
 * Get current router state
 */
export function getRouterState(): RouterState {
  return routerState;
}

// Callback for URL-based query changes (browser navigation)
let onSlugChangeCallback: ((slug: string | null) => void) | null = null;

/**
 * Register callback for URL-based slug changes
 * Called when user navigates with browser back/forward buttons
 */
export function onUrlSlugChange(callback: (slug: string | null) => void): () => void {
  onSlugChangeCallback = callback;
  return () => {
    onSlugChangeCallback = null;
  };
}

/**
 * Handle browser popstate event (back/forward navigation)
 */
function handlePopState(event: PopStateEvent): void {
  const slug = event.state?.slug ?? getSlugFromUrl();

  logger.store('router', 'Popstate navigation', { slug });

  if (onSlugChangeCallback) {
    onSlugChangeCallback(slug);
  }
}

/**
 * Initialize router (restore state from localStorage, register popstate handler)
 */
export function initializeRouter(): void {
  const sidebarOpen = getStorageItem<boolean>(STORAGE_KEYS.SIDEBAR_OPEN);
  const sidebarWidth = getStorageItem<number>(STORAGE_KEYS.SIDEBAR_WIDTH);

  routerState.activeQueryId = null;

  if (sidebarOpen !== null) {
    routerState.sidebarOpen = sidebarOpen;
  }

  if (sidebarWidth !== null) {
    routerState.sidebarWidth = Math.max(
      MIN_SIDEBAR_WIDTH,
      Math.min(MAX_SIDEBAR_WIDTH, sidebarWidth)
    );
  }

  window.addEventListener('popstate', handlePopState);
  logger.store('router', 'Initialized router');
}

/**
 * Cleanup router (remove event listeners)
 */
export function cleanupRouter(): void {
  window.removeEventListener('popstate', handlePopState);
  onSlugChangeCallback = null;
}

// Export constants for use in components
export { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH };
