/**
 * Slug utilities for URL-friendly identifiers
 */

/**
 * Generate a URL-friendly slug from a string
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[äöüß]/g, (char) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens from start/end
}

/**
 * Check if two titles would generate the same slug
 */
export function slugsMatch(title1: string, title2: string): boolean {
  return generateSlug(title1) === generateSlug(title2);
}
