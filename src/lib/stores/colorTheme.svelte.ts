/**
 * Color Theme Store
 * Manages accent color themes with Svelte 5 Runes
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type ColorTheme = 'blue' | 'teal' | 'green' | 'purple' | 'orange' | 'rose';

export interface ColorThemeOption {
  id: ColorTheme;
  label: string;
  color: string; // Primary color for preview
}

export const COLOR_THEMES: ColorThemeOption[] = [
  { id: 'blue', label: 'Blue', color: '#1868db' },
  { id: 'teal', label: 'Teal', color: '#0891b2' },
  { id: 'green', label: 'Green', color: '#16a34a' },
  { id: 'purple', label: 'Purple', color: '#9333ea' },
  { id: 'orange', label: 'Orange', color: '#ea580c' },
  { id: 'rose', label: 'Rose', color: '#e11d48' }
];

// State container object (mutable properties, not reassignable)
export const colorThemeState = $state({
  colorTheme: 'blue' as ColorTheme
});

/**
 * Initialize color theme from storage
 */
export function initializeColorTheme(): void {
  const stored = getStorageItem<ColorTheme>(STORAGE_KEYS.COLOR_THEME);
  if (stored && COLOR_THEMES.some((t) => t.id === stored)) {
    colorThemeState.colorTheme = stored;
  }

  applyColorTheme();

  logger.store('colorTheme', 'Initialized', {
    colorTheme: colorThemeState.colorTheme
  });
}

/**
 * Apply color theme to document
 */
function applyColorTheme(): void {
  if (typeof document !== 'undefined') {
    // Remove all theme classes
    COLOR_THEMES.forEach((theme) => {
      document.documentElement.classList.remove(`color-theme-${theme.id}`);
    });

    // Add current theme class (blue is default, no class needed)
    if (colorThemeState.colorTheme !== 'blue') {
      document.documentElement.classList.add(`color-theme-${colorThemeState.colorTheme}`);
    }
  }
}

/**
 * Set color theme preference
 */
export function setColorTheme(newTheme: ColorTheme): void {
  colorThemeState.colorTheme = newTheme;
  applyColorTheme();
  setStorageItem(STORAGE_KEYS.COLOR_THEME, colorThemeState.colorTheme);
  logger.store('colorTheme', 'Color theme changed', {
    colorTheme: colorThemeState.colorTheme
  });
}

/**
 * Get current color theme setting
 */
export function getColorTheme(): ColorTheme {
  return colorThemeState.colorTheme;
}
