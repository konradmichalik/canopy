/**
 * Date Format Store
 * Manages absolute vs relative date display mode with Svelte 5 Runes
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type DateFormat = 'absolute' | 'relative';

// State container
export const dateFormatState = $state({
  format: 'absolute' as DateFormat
});

/**
 * Initialize date format from storage
 */
export function initializeDateFormat(): void {
  const stored = getStorageItem<DateFormat>(STORAGE_KEYS.DATE_FORMAT);
  if (stored && ['absolute', 'relative'].includes(stored)) {
    dateFormatState.format = stored;
  }

  logger.store('dateFormat', 'Initialized', {
    format: dateFormatState.format
  });
}

/**
 * Set date format
 */
export function setDateFormat(format: DateFormat): void {
  dateFormatState.format = format;
  setStorageItem(STORAGE_KEYS.DATE_FORMAT, format);
  logger.store('dateFormat', 'Changed', { format });
}

/**
 * Toggle between absolute and relative
 */
export function toggleDateFormat(): void {
  const newFormat = dateFormatState.format === 'absolute' ? 'relative' : 'absolute';
  setDateFormat(newFormat);
}

/**
 * Check if relative mode is active
 */
export function isRelativeDate(): boolean {
  return dateFormatState.format === 'relative';
}
