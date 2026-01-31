/**
 * Issue Selection Store
 * Manages multi-select state for bulk operations (ephemeral, not persisted)
 */

import type { TreeNode } from '../types';
import { logger } from '../utils/logger';

// State container
export const selectionState = $state({
	selectionMode: false,
	selectedKeys: {} as Record<string, true>,
	lastSelectedKey: null as string | null
});

/**
 * Toggle selection mode on/off. Clearing selection when deactivating.
 */
export function toggleSelectionMode(): void {
	selectionState.selectionMode = !selectionState.selectionMode;
	if (!selectionState.selectionMode) {
		selectionState.selectedKeys = {};
		selectionState.lastSelectedKey = null;
	}
	logger.store('selection', 'Mode toggled', { active: selectionState.selectionMode });
}

/**
 * Toggle selection of a single issue
 */
export function toggleSelection(key: string): void {
	if (selectionState.selectedKeys[key]) {
		const { [key]: _, ...rest } = selectionState.selectedKeys;
		selectionState.selectedKeys = rest;
	} else {
		selectionState.selectedKeys = {
			...selectionState.selectedKeys,
			[key]: true
		};
	}
	selectionState.lastSelectedKey = key;
}

/**
 * Select a range of issues between lastSelectedKey and toKey
 * Uses visible (flattened) tree order for range calculation
 */
export function selectRange(toKey: string, visibleNodes: TreeNode[]): void {
	const fromKey = selectionState.lastSelectedKey;
	if (!fromKey) {
		toggleSelection(toKey);
		return;
	}

	const fromIndex = visibleNodes.findIndex((n) => n.issue.key === fromKey);
	const toIndex = visibleNodes.findIndex((n) => n.issue.key === toKey);
	if (fromIndex === -1 || toIndex === -1) {
		toggleSelection(toKey);
		return;
	}

	const start = Math.min(fromIndex, toIndex);
	const end = Math.max(fromIndex, toIndex);
	const rangeKeys = visibleNodes.slice(start, end + 1).map((n) => n.issue.key);

	const newSelected = { ...selectionState.selectedKeys };
	for (const key of rangeKeys) {
		newSelected[key] = true;
	}
	selectionState.selectedKeys = newSelected;
	selectionState.lastSelectedKey = toKey;

	logger.store('selection', 'Range selected', { count: rangeKeys.length });
}

/**
 * Select all provided keys
 */
export function selectAll(keys: string[]): void {
	const newSelected: Record<string, true> = {};
	for (const key of keys) {
		newSelected[key] = true;
	}
	selectionState.selectedKeys = newSelected;

	logger.store('selection', 'All selected', { count: keys.length });
}

/**
 * Clear all selections
 */
export function clearSelection(): void {
	selectionState.selectionMode = false;
	selectionState.selectedKeys = {};
	selectionState.lastSelectedKey = null;
}

/**
 * Check if an issue is selected
 */
export function isSelected(key: string): boolean {
	return !!selectionState.selectedKeys[key];
}

/**
 * Get all selected issue keys
 */
export function getSelectedKeys(): string[] {
	return Object.keys(selectionState.selectedKeys);
}

/**
 * Get count of selected issues
 */
export function getSelectedCount(): number {
	return Object.keys(selectionState.selectedKeys).length;
}

/**
 * Check if any issues are selected
 */
export function hasSelection(): boolean {
	return getSelectedCount() > 0;
}

/**
 * Build a Jira Issue Navigator URL with JQL for bulk editing
 * Returns the URL and an optional warning if the URL is very long
 */
export function buildBulkEditUrl(
	baseUrl: string,
	issueKeys: string[]
): { url: string; warning: string | null } {
	const jql = `issuekey in (${issueKeys.join(', ')})`;
	const encodedJql = encodeURIComponent(jql);
	const url = `${baseUrl}/issues/?jql=${encodedJql}`;

	let warning: string | null = null;
	if (url.length > 8000) {
		warning = 'URL too long. Please select fewer issues.';
	} else if (url.length > 2000) {
		warning = 'Many issues selected. Some browsers may not support this URL length.';
	}

	return { url, warning };
}

/**
 * Copy selected issue keys to clipboard (newline-separated)
 */
export async function copySelectedKeys(keys: string[]): Promise<void> {
	await navigator.clipboard.writeText(keys.join(', '));
}
