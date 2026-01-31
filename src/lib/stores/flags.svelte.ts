/**
 * Issue Flags Store
 * Manages colored flags on issues for visual marking
 */

import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type FlagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface FlagColorOption {
  id: FlagColor;
  label: string;
  color: string;
}

export const FLAG_COLORS: FlagColorOption[] = [
  { id: 'red', label: 'Rot', color: '#bf616a' },
  { id: 'orange', label: 'Orange', color: '#d08770' },
  { id: 'yellow', label: 'Gelb', color: '#ebcb8b' },
  { id: 'green', label: 'Grün', color: '#a3be8c' },
  { id: 'blue', label: 'Blau', color: '#5e81ac' },
  { id: 'purple', label: 'Lila', color: '#b48ead' }
];

// State container
export const flagsState = $state({
  flags: {} as Record<string, FlagColor>
});

/**
 * Initialize flags from storage
 */
export async function initializeFlags(): Promise<void> {
  const stored = await getStorageItemAsync<Record<string, FlagColor>>(STORAGE_KEYS.FLAGS);
  if (stored && typeof stored === 'object') {
    flagsState.flags = stored;
  }

  logger.store('flags', 'Initialized', {
    count: Object.keys(flagsState.flags).length
  });
}

/**
 * Set a flag color on an issue
 */
export function setFlag(issueKey: string, color: FlagColor): void {
  flagsState.flags = {
    ...flagsState.flags,
    [issueKey]: color
  };
  saveStorage(STORAGE_KEYS.FLAGS, flagsState.flags);
  logger.store('flags', 'Flag set', { issueKey, color });
}

/**
 * Remove a flag from an issue
 */
export function removeFlag(issueKey: string): void {
  const { [issueKey]: _, ...rest } = flagsState.flags;
  flagsState.flags = rest;
  saveStorage(STORAGE_KEYS.FLAGS, flagsState.flags);
  logger.store('flags', 'Flag removed', { issueKey });
}

/**
 * Toggle a flag: set if not present or different color, remove if same color
 */
export function toggleFlag(issueKey: string, color: FlagColor): void {
  if (flagsState.flags[issueKey] === color) {
    removeFlag(issueKey);
  } else {
    setFlag(issueKey, color);
  }
}

/**
 * Get the flag color for an issue (or null if not flagged)
 */
export function getFlag(issueKey: string): FlagColor | null {
  return flagsState.flags[issueKey] ?? null;
}

/**
 * Get the hex color value for a flag
 */
export function getFlagHexColor(color: FlagColor): string {
  return FLAG_COLORS.find((f) => f.id === color)?.color ?? '#5e81ac';
}

/**
 * Get count of flagged issues
 */
export function getFlaggedCount(): number {
  return Object.keys(flagsState.flags).length;
}

/**
 * Clear all flags
 */
export function clearAllFlags(): void {
  flagsState.flags = {};
  saveStorage(STORAGE_KEYS.FLAGS, flagsState.flags);
  logger.store('flags', 'All flags cleared');
}
