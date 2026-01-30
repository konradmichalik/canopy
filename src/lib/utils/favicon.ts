/**
 * Favicon utilities for dynamic badge indicators
 */

const FAVICON_PATH = '/favicon.svg';

// Pre-encoded badge SVG (blue dot, top-right corner)
const BADGE_CIRCLE = encodeURIComponent('<circle cx="900" cy="100" r="100" fill="#3b82f6"/>');

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
      badgedFaviconUrl = `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 1000 1000' xmlns='http://www.w3.org/2000/svg' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3E%3Cg transform='matrix(1.000084,0,0,1.000084,-19.443348,13.581757)'%3E%3Cg transform='matrix(80.122596,0,0,80.122596,-1082.405678,-995.890857)'%3E%3Ccircle cx='17.5' cy='18.5' r='2.5' style='fill:rgb(163,190,140);'/%3E%3C/g%3E%3Cg transform='matrix(80.122596,0,0,80.122596,-683.086213,-995.890857)'%3E%3Ccircle cx='17.5' cy='18.5' r='2.5' style='fill:rgb(208,135,112);'/%3E%3C/g%3E%3C/g%3E${BADGE_CIRCLE}%3C/svg%3E`;
    }
    link.href = badgedFaviconUrl;
  } else {
    link.href = FAVICON_PATH;
  }
}
