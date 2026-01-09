/**
 * Theme Store
 * Manages dark/light mode with Svelte 5 Runes
 */

import type { Theme as ThemeType } from '../types';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type Theme = ThemeType;

// State container object (mutable properties, not reassignable)
export const themeState = $state({
  theme: 'system' as Theme,
  resolvedTheme: 'light' as 'light' | 'dark'
});

// Media query for system preference
let mediaQuery: MediaQueryList | null = null;

/**
 * Initialize theme from storage and system preference
 */
export async function initializeTheme(): Promise<void> {
  // Load saved preference
  const stored = await getStorageItemAsync<Theme>(STORAGE_KEYS.THEME);
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    themeState.theme = stored;
  }

  // Set up system preference listener
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemChange);
  }

  // Apply initial theme
  updateResolvedTheme();
  applyTheme();

  logger.store('theme', 'Initialized', {
    theme: themeState.theme,
    resolvedTheme: themeState.resolvedTheme
  });
}

/**
 * Handle system color scheme change
 */
function handleSystemChange(e: MediaQueryListEvent): void {
  if (themeState.theme === 'system') {
    themeState.resolvedTheme = e.matches ? 'dark' : 'light';
    applyTheme();
    logger.store('theme', 'System preference changed', { resolvedTheme: themeState.resolvedTheme });
  }
}

/**
 * Update resolved theme based on current setting
 */
function updateResolvedTheme(): void {
  if (themeState.theme === 'system') {
    themeState.resolvedTheme = mediaQuery?.matches ? 'dark' : 'light';
  } else {
    themeState.resolvedTheme = themeState.theme;
  }
}

/**
 * Apply theme to document
 */
function applyTheme(): void {
  if (typeof document !== 'undefined') {
    // Atlassian Design Tokens: Set data-color-mode attribute
    document.documentElement.setAttribute('data-color-mode', themeState.resolvedTheme);

    // Keep .dark class for Tailwind dark mode utilities
    if (themeState.resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

/**
 * Set theme preference
 */
export function setTheme(newTheme: Theme): void {
  themeState.theme = newTheme;
  updateResolvedTheme();
  applyTheme();
  saveStorage(STORAGE_KEYS.THEME, themeState.theme);
  logger.store('theme', 'Theme changed', {
    theme: themeState.theme,
    resolvedTheme: themeState.resolvedTheme
  });
}

/**
 * Toggle between light and dark
 */
export function toggleTheme(): void {
  const newTheme = themeState.resolvedTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * Get current theme setting
 */
export function getTheme(): Theme {
  return themeState.theme;
}

/**
 * Get resolved theme (actual light/dark)
 */
export function getResolvedTheme(): 'light' | 'dark' {
  return themeState.resolvedTheme;
}

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  return themeState.resolvedTheme === 'dark';
}

/**
 * Cleanup listener
 */
export function cleanupTheme(): void {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemChange);
  }
}
