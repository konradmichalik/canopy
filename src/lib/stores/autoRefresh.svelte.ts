/**
 * Auto-Refresh Store
 * Manages automatic refresh of issues and sidebar counts
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';
import { refreshIssues, issuesState } from './issues.svelte';
import { getQueries, updateQueryIssueCount } from './jql.svelte';
import { getClient } from './connection.svelte';

export type AutoRefreshInterval = 'off' | '5m' | '30m' | '1h';

const INTERVAL_MS: Record<AutoRefreshInterval, number> = {
  off: 0,
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000
};

export const AUTO_REFRESH_OPTIONS: { value: AutoRefreshInterval; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '5m', label: '5 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' }
];

// State container
export const autoRefreshState = $state({
  interval: 'off' as AutoRefreshInterval
});

// Timer reference
let refreshTimerId: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize auto-refresh from storage
 */
export function initializeAutoRefresh(): void {
  const stored = getStorageItem<AutoRefreshInterval>(STORAGE_KEYS.AUTO_REFRESH_INTERVAL);
  if (stored && Object.keys(INTERVAL_MS).includes(stored)) {
    autoRefreshState.interval = stored;
    startTimer();
  }

  logger.store('autoRefresh', 'Initialized', {
    interval: autoRefreshState.interval
  });
}

/**
 * Set auto-refresh interval
 */
export function setAutoRefreshInterval(interval: AutoRefreshInterval): void {
  autoRefreshState.interval = interval;
  setStorageItem(STORAGE_KEYS.AUTO_REFRESH_INTERVAL, interval);

  // Restart timer with new interval
  stopTimer();
  startTimer();

  logger.store('autoRefresh', 'Changed', { interval });
}

/**
 * Start the refresh timer
 */
function startTimer(): void {
  const ms = INTERVAL_MS[autoRefreshState.interval];
  if (ms === 0) {
    return;
  }

  refreshTimerId = setInterval(async () => {
    await performRefresh();
  }, ms);

  logger.debug(`Auto-refresh timer started: ${autoRefreshState.interval}`);
}

/**
 * Stop the refresh timer
 */
function stopTimer(): void {
  if (refreshTimerId !== null) {
    clearInterval(refreshTimerId);
    refreshTimerId = null;
    logger.debug('Auto-refresh timer stopped');
  }
}

/**
 * Perform the actual refresh
 */
async function performRefresh(): Promise<void> {
  if (issuesState.isLoading) {
    return;
  }

  const client = getClient();
  if (!client) {
    return;
  }

  logger.info('Auto-refresh started');

  try {
    // Refresh current query issues (if any query is loaded)
    if (issuesState.currentJql) {
      await refreshIssues();
    }

    // Refresh issue counts for all queries in sidebar
    const queries = getQueries();
    await Promise.all(
      queries.map(async (query) => {
        try {
          const response = await client.searchIssues({
            jql: query.jql,
            maxResults: 0
          });
          updateQueryIssueCount(query.id, response.total);
        } catch {
          // Silently ignore individual query failures
        }
      })
    );

    logger.info('Auto-refresh completed');
  } catch (error) {
    logger.error('Auto-refresh failed', error);
  }
}

/**
 * Cleanup function for unmounting
 */
export function cleanupAutoRefresh(): void {
  stopTimer();
}
