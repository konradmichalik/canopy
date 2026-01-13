/**
 * Favicon utilities for dynamic badge indicators
 */

const FAVICON_PATH = '/favicon.svg';

// Pre-encoded badge SVG (blue dot, top-right corner)
const BADGE_CIRCLE = encodeURIComponent('<circle cx="27" cy="5" r="5" fill="#3b82f6"/>');

// Cache the badged favicon data URL
let badgedFaviconUrl: string | null = null;

/**
 * Set the favicon with or without a notification badge
 */
export function setFaviconBadge(showBadge: boolean): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;

  if (showBadge) {
    // Lazy-build the badged favicon URL on first use
    if (!badgedFaviconUrl) {
      badgedFaviconUrl = `data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;'%3E%3Cpath d='M8,7L8,26M8,10L12,10M8,18L12,18M8,26L12,26' style='fill:none;stroke:rgb(100,116,139);stroke-width:2px;'/%3E%3Cg transform='matrix(0.5,0,0,0.833333,3,0.333333)'%3E%3Cpath d='M16,3.8L16,6.2C16,7.193 14.656,8 13,8L7,8C5.344,8 4,7.193 4,6.2L4,3.8C4,2.807 5.344,2 7,2L13,2C14.656,2 16,2.807 16,3.8Z' style='fill:rgb(100,116,139);'/%3E%3C/g%3E%3Cpath d='M28,8.5L28,11.5C28,12.328 27.328,13 26.5,13L15.5,13C14.672,13 14,12.328 14,11.5L14,8.5C14,7.672 14.672,7 15.5,7L26.5,7C27.328,7 28,7.672 28,8.5Z' style='fill:rgb(168,85,247);'/%3E%3Cpath d='M28,16.5L28,19.5C28,20.328 27.328,21 26.5,21L15.5,21C14.672,21 14,20.328 14,19.5L14,16.5C14,15.672 14.672,15 15.5,15L26.5,15C27.328,15 28,15.672 28,16.5Z' style='fill:rgb(34,197,94);'/%3E%3Cpath d='M28,24.5L28,27.5C28,28.328 27.328,29 26.5,29L15.5,29C14.672,29 14,28.328 14,27.5L14,24.5C14,23.672 14.672,23 15.5,23L26.5,23C27.328,23 28,23.672 28,24.5Z' style='fill:rgb(59,130,246);'/%3E${BADGE_CIRCLE}%3C/svg%3E`;
    }
    link.href = badgedFaviconUrl;
  } else {
    link.href = FAVICON_PATH;
  }
}
