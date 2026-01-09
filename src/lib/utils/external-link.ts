/**
 * External Link Utility
 * Opens URLs in the default browser, supporting both Browser and Tauri platforms.
 */

import { isTauri } from './storage';

/**
 * Open a URL in the default browser
 * - In Tauri (desktop): Uses the shell plugin to open in system browser
 * - In Browser: Uses window.open()
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } catch (error) {
      console.error('Failed to open URL in Tauri:', error);
      // Fallback to window.open if shell plugin fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
