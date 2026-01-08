/**
 * Date Formatting Utilities
 * Provides both absolute (dd.mm.yyyy) and relative ("2 days ago") date formatting
 */

import { dateFormatState } from '../stores/dateFormat.svelte';

/**
 * Format a date string as relative time (e.g., "2 minutes ago", "3 days ago")
 */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Future dates fall back to absolute
  if (diffMs < 0) {
    return formatAbsoluteDate(dateStr);
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return '1 year ago';
  return `${diffYears} years ago`;
}

/**
 * Format a date string as absolute date (dd.mm.yyyy)
 */
function formatAbsoluteDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date based on the current date format setting
 */
export function formatDate(dateStr: string): string {
  return dateFormatState.format === 'relative'
    ? formatRelativeDate(dateStr)
    : formatAbsoluteDate(dateStr);
}

/**
 * Format a date with time for tooltips (always absolute)
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a short date (e.g., for sprint labels: "8. Jan")
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short'
  });
}

export interface DueDateStatus {
  colorClass: string;
  iconColor: string;
  label: string;
}

/**
 * Get due date status with color and label based on how close the due date is
 */
export function getDueDateStatus(dateStr: string): DueDateStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      colorClass: 'text-destructive',
      iconColor: 'var(--color-destructive)',
      label: 'Overdue'
    };
  }
  if (diffDays <= 2) {
    const label = diffDays === 0 ? 'Due today' : `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return { colorClass: 'text-warning', iconColor: 'var(--color-warning)', label };
  }
  const label = diffDays <= 7 ? `Due in ${diffDays} days` : 'Due';
  return { colorClass: 'text-text-subtle', iconColor: 'var(--color-text-subtle)', label };
}
