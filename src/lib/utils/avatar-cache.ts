/**
 * Global cache for avatar blob URLs
 * Prevents re-fetching the same avatar multiple times
 */

import { fetchImageWithAuth } from '../stores/connection.svelte';

// Global cache: original URL -> blob URL
const avatarCache = new Map<string, string>();

// Pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Get avatar blob URL from cache or fetch with auth
 */
export async function getAvatarUrl(originalUrl: string): Promise<string | null> {
  // Check cache first
  const cached = avatarCache.get(originalUrl);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending request for this URL
  const pending = pendingRequests.get(originalUrl);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = fetchImageWithAuth(originalUrl).then((blobUrl) => {
    pendingRequests.delete(originalUrl);
    if (blobUrl) {
      avatarCache.set(originalUrl, blobUrl);
    }
    return blobUrl;
  });

  pendingRequests.set(originalUrl, request);
  return request;
}

/**
 * Clear the avatar cache (e.g., on disconnect)
 */
export function clearAvatarCache(): void {
  // Revoke all blob URLs to free memory
  for (const blobUrl of avatarCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  avatarCache.clear();
  pendingRequests.clear();
}

/**
 * Check if URL is cached
 */
export function isAvatarCached(originalUrl: string): boolean {
  return avatarCache.has(originalUrl);
}

/**
 * Get cached URL synchronously (returns null if not cached)
 */
export function getCachedAvatarUrl(originalUrl: string): string | null {
  return avatarCache.get(originalUrl) ?? null;
}
