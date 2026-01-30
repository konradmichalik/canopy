/**
 * Version Check Utility
 * Checks GitHub releases for newer versions of the app (once per day).
 */

import { logger } from './logger';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/konradmichalik/canopy/releases/latest';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface UpdateInfo {
  tagName: string;
  releaseUrl: string;
}

// Cached result from the last check (available synchronously after initial check)
let cachedUpdate: UpdateInfo | null = null;
let hasChecked = false;

/**
 * Check for a newer app version via GitHub releases.
 * Returns update info if a newer release exists, null otherwise.
 * Skips the network request if the last check was less than 24h ago.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    if (!shouldCheck()) {
      logger.debug('Version check: skipped (checked recently)');
      return null;
    }

    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      logger.warn(`Version check: GitHub API returned ${response.status}`);
      return null;
    }

    const release = (await response.json()) as {
      tag_name: string;
      html_url: string;
      published_at: string;
    };

    // Record that we checked
    setStorageItem(STORAGE_KEYS.UPDATE_LAST_CHECKED, Date.now());

    const releaseDate = new Date(release.published_at).getTime();
    const buildDate = new Date(__BUILD_DATE__).getTime();

    if (releaseDate <= buildDate) {
      logger.debug('Version check: app is up to date');
      cachedUpdate = null;
      hasChecked = true;
      return null;
    }

    // Check if user already dismissed this version
    const dismissed = getStorageItem<string>(STORAGE_KEYS.UPDATE_DISMISSED_VERSION);
    if (dismissed === release.tag_name) {
      logger.debug(`Version check: ${release.tag_name} was dismissed`);
      cachedUpdate = null;
      hasChecked = true;
      return null;
    }

    logger.info(`Version check: new version available (${release.tag_name})`);
    cachedUpdate = { tagName: release.tag_name, releaseUrl: release.html_url };
    hasChecked = true;
    return cachedUpdate;
  } catch (error) {
    logger.warn('Version check: failed', error);
    return null;
  }
}

/**
 * Dismiss a specific version so the notification won't reappear for it.
 */
export function dismissUpdate(tagName: string): void {
  setStorageItem(STORAGE_KEYS.UPDATE_DISMISSED_VERSION, tagName);
}

/**
 * Get the cached result from the last version check (synchronous).
 * Returns null if no check has been performed yet.
 */
export function getCachedUpdateStatus(): { checked: boolean; update: UpdateInfo | null } {
  return { checked: hasChecked, update: cachedUpdate };
}

function shouldCheck(): boolean {
  const lastChecked = getStorageItem<number>(STORAGE_KEYS.UPDATE_LAST_CHECKED);
  if (lastChecked === null) return true;
  return Date.now() - lastChecked >= CHECK_INTERVAL_MS;
}
