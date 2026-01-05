/**
 * Display Density Store
 * Manages compact vs comfortable display mode with Svelte 5 Runes
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type DisplayDensity = 'comfortable' | 'compact';

// State container
export const displayDensityState = $state({
  density: 'comfortable' as DisplayDensity
});

/**
 * Initialize display density from storage
 */
export function initializeDisplayDensity(): void {
  const stored = getStorageItem<DisplayDensity>(STORAGE_KEYS.DISPLAY_DENSITY);
  if (stored && ['comfortable', 'compact'].includes(stored)) {
    displayDensityState.density = stored;
  }

  logger.store('displayDensity', 'Initialized', {
    density: displayDensityState.density
  });
}

/**
 * Set display density
 */
export function setDisplayDensity(density: DisplayDensity): void {
  displayDensityState.density = density;
  setStorageItem(STORAGE_KEYS.DISPLAY_DENSITY, density);
  logger.store('displayDensity', 'Changed', { density });
}

/**
 * Toggle between comfortable and compact
 */
export function toggleDisplayDensity(): void {
  const newDensity = displayDensityState.density === 'comfortable' ? 'compact' : 'comfortable';
  setDisplayDensity(newDensity);
}

/**
 * Check if compact mode is active
 */
export function isCompact(): boolean {
  return displayDensityState.density === 'compact';
}
