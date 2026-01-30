/**
 * Shared avatar color palette and assignment logic.
 * Uses Nord Aurora (Nord11-15) + Frost (Nord7-10) accent colors.
 */

import type { JiraUser } from '../types';

const AVATAR_COLORS = [
  '#5e81ac', // Deep Blue (Nord10)
  '#a3be8c', // Green (Nord14)
  '#bf616a', // Red (Nord11)
  '#b48ead', // Purple (Nord15)
  '#d08770', // Orange (Nord12)
  '#88c0d0', // Frost (Nord8)
  '#8fbcbb', // Teal (Nord7)
  '#81a1c1', // Steel Blue (Nord9)
  '#ebcb8b' // Yellow (Nord13)
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/** Get a deterministic color for a string identifier. */
export function getAvatarColor(identifier: string): string {
  const hash = hashString(identifier);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Get a deterministic color for a Jira user (resolves identifier automatically). */
export function getUserColor(user: JiraUser): string {
  const identifier = user.accountId || user.emailAddress || user.displayName || '';
  return getAvatarColor(identifier);
}
