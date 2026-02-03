/**
 * Color Intensity Store
 * Manages color palette intensity (pastel Nord vs vivid) with Svelte 5 Runes
 */

import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export type ColorIntensity = 'pastel' | 'vivid';

export interface ColorIntensityOption {
  id: ColorIntensity;
  label: string;
  description: string;
}

export const COLOR_INTENSITY_OPTIONS: ColorIntensityOption[] = [
  { id: 'pastel', label: 'Nordic', description: 'Soft, muted colors (default)' },
  { id: 'vivid', label: 'Vivid', description: 'Saturated, high-contrast colors' }
];

// State container object (mutable properties, not reassignable)
export const colorIntensityState = $state({
  intensity: 'pastel' as ColorIntensity
});

/**
 * Initialize color intensity from storage
 */
export async function initializeColorIntensity(): Promise<void> {
  const stored = await getStorageItemAsync<ColorIntensity>(STORAGE_KEYS.COLOR_INTENSITY);

  if (stored && COLOR_INTENSITY_OPTIONS.some((o) => o.id === stored)) {
    colorIntensityState.intensity = stored;
  }

  applyColorIntensity();

  logger.store('colorIntensity', 'Initialized', {
    intensity: colorIntensityState.intensity
  });
}

/**
 * Apply color intensity to document
 */
function applyColorIntensity(): void {
  if (typeof document !== 'undefined') {
    // Remove all intensity classes
    document.documentElement.classList.remove('color-intensity-vivid');

    // Add vivid class if selected (pastel is default, no class needed)
    if (colorIntensityState.intensity === 'vivid') {
      document.documentElement.classList.add('color-intensity-vivid');
    }
  }
}

/**
 * Set color intensity preference
 */
export function setColorIntensity(intensity: ColorIntensity): void {
  colorIntensityState.intensity = intensity;
  applyColorIntensity();
  saveStorage(STORAGE_KEYS.COLOR_INTENSITY, colorIntensityState.intensity);
  logger.store('colorIntensity', 'Color intensity changed', {
    intensity: colorIntensityState.intensity
  });
}

/**
 * Get current color intensity setting
 */
export function getColorIntensity(): ColorIntensity {
  return colorIntensityState.intensity;
}
