/**
 * Help Modal Store
 * Manages help modal visibility and first-visit detection
 */

import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

export const helpModalState = $state({
  isOpen: false,
  currentSlide: 0,
  hasSeenIntro: false
});

/**
 * Initialize help modal state from storage
 */
export async function initializeHelpModal(): Promise<void> {
  const hasSeen = await getStorageItemAsync<boolean>(STORAGE_KEYS.HELP_MODAL_SEEN);
  helpModalState.hasSeenIntro = hasSeen ?? false;

  // Auto-open on first visit
  if (!helpModalState.hasSeenIntro) {
    helpModalState.isOpen = true;
  }

  logger.store('helpModal', 'Initialized', { hasSeenIntro: helpModalState.hasSeenIntro });
}

/**
 * Open the help modal
 */
export function openHelpModal(): void {
  helpModalState.isOpen = true;
  helpModalState.currentSlide = 0;
  logger.store('helpModal', 'Opened');
}

/**
 * Close the help modal
 */
export function closeHelpModal(): void {
  helpModalState.isOpen = false;
  logger.store('helpModal', 'Closed');
}

/**
 * Mark intro as seen (don't show again)
 */
export function markIntroAsSeen(): void {
  helpModalState.hasSeenIntro = true;
  saveStorage(STORAGE_KEYS.HELP_MODAL_SEEN, true);
  logger.store('helpModal', 'Marked as seen');
}

/**
 * Reset intro (for testing/re-showing)
 */
export function resetIntro(): void {
  helpModalState.hasSeenIntro = false;
  saveStorage(STORAGE_KEYS.HELP_MODAL_SEEN, false);
  logger.store('helpModal', 'Reset intro');
}

/**
 * Navigate to specific slide
 */
export function goToSlide(index: number): void {
  helpModalState.currentSlide = index;
}

/**
 * Navigate to next slide
 */
export function nextSlide(totalSlides: number): void {
  if (helpModalState.currentSlide < totalSlides - 1) {
    helpModalState.currentSlide++;
  }
}

/**
 * Navigate to previous slide
 */
export function prevSlide(): void {
  if (helpModalState.currentSlide > 0) {
    helpModalState.currentSlide--;
  }
}
