/**
 * Default Fields Store
 * Global default for which fields are displayed on issue cards (used when creating new queries)
 */

import type { DisplayFieldId } from './fieldConfig.svelte';
import { DEFAULT_FIELD_IDS } from './fieldConfig.svelte';
import { getStorageItemAsync, saveStorage, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container
export const defaultFieldsState = $state({
  fieldIds: [...DEFAULT_FIELD_IDS] as DisplayFieldId[]
});

/**
 * Initialize default fields from storage
 */
export async function initializeDefaultFields(): Promise<void> {
  const stored = await getStorageItemAsync<DisplayFieldId[]>(STORAGE_KEYS.DEFAULT_FIELDS);
  if (stored !== null && Array.isArray(stored) && stored.length > 0) {
    defaultFieldsState.fieldIds = stored;
  }

  logger.store('defaultFields', 'Initialized', {
    fieldIds: defaultFieldsState.fieldIds
  });
}

/**
 * Set all default field IDs at once
 */
export function setDefaultFields(fieldIds: DisplayFieldId[]): void {
  defaultFieldsState.fieldIds = [...fieldIds];
  saveStorage(STORAGE_KEYS.DEFAULT_FIELDS, defaultFieldsState.fieldIds);
  logger.store('defaultFields', 'Changed', { fieldIds: defaultFieldsState.fieldIds });
}

/**
 * Toggle a single field in the default set
 */
export function toggleDefaultField(fieldId: DisplayFieldId): void {
  const index = defaultFieldsState.fieldIds.indexOf(fieldId);
  if (index >= 0) {
    defaultFieldsState.fieldIds = defaultFieldsState.fieldIds.filter((id) => id !== fieldId);
  } else {
    defaultFieldsState.fieldIds = [...defaultFieldsState.fieldIds, fieldId];
  }
  saveStorage(STORAGE_KEYS.DEFAULT_FIELDS, defaultFieldsState.fieldIds);
  logger.store('defaultFields', 'Toggled', { fieldId, enabled: index < 0 });
}

/**
 * Check if a field is in the default set
 */
export function isDefaultField(fieldId: DisplayFieldId): boolean {
  return defaultFieldsState.fieldIds.includes(fieldId);
}

/**
 * Get current default field IDs
 */
export function getDefaultFieldIds(): DisplayFieldId[] {
  return defaultFieldsState.fieldIds;
}
