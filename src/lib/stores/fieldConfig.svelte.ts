/**
 * Field Configuration Store
 * Manages which fields are displayed on issue cards
 * Configuration is stored per query
 */

import { logger } from '../utils/logger';
import { getDefaultFieldIds } from './defaultFields.svelte';

// ============================================
// Types
// ============================================

export type DisplayFieldId =
  | 'blockingIndicator'
  | 'aggregatedTimeProgress'
  | 'aggregatedResolutionProgress'
  | 'status'
  | 'assignee'
  | 'priority'
  | 'created'
  | 'updated'
  | 'dueDate'
  | 'comments'
  | 'components'
  | 'labels'
  | 'resolution'
  | 'fixVersions';

export interface DisplayField {
  id: DisplayFieldId;
  label: string;
  labelDe: string;
  isEnabled: boolean;
}

export interface FieldConfigState {
  fields: DisplayField[];
  currentQueryId: string | null;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_FIELD_IDS: DisplayFieldId[] = [
  'aggregatedTimeProgress',
  'status',
  'assignee',
  'updated'
];

export const ALL_FIELDS: Omit<DisplayField, 'isEnabled'>[] = [
  {
    id: 'blockingIndicator',
    label: 'Blocking Links',
    labelDe: 'Blockierungen'
  },
  {
    id: 'aggregatedTimeProgress',
    label: 'Time Progress',
    labelDe: 'Zeitfortschritt'
  },
  {
    id: 'aggregatedResolutionProgress',
    label: 'Completion',
    labelDe: 'Abschluss'
  },
  { id: 'status', label: 'Status', labelDe: 'Status' },
  { id: 'assignee', label: 'Assignee', labelDe: 'Bearbeiter' },
  { id: 'priority', label: 'Priority', labelDe: 'Priorität' },
  { id: 'created', label: 'Created', labelDe: 'Erstelldatum' },
  { id: 'updated', label: 'Updated', labelDe: 'Bearbeitungsdatum' },
  { id: 'dueDate', label: 'Due Date', labelDe: 'Fälligkeitsdatum' },
  { id: 'comments', label: 'Comments', labelDe: 'Kommentare' },
  { id: 'components', label: 'Components', labelDe: 'Komponenten' },
  { id: 'labels', label: 'Labels', labelDe: 'Stichwörter' },
  { id: 'resolution', label: 'Resolution', labelDe: 'Lösung' },
  { id: 'fixVersions', label: 'Fix Version', labelDe: 'Release' }
];

// Callback to persist changes to query
let onFieldConfigChange: ((enabledFieldIds: DisplayFieldId[]) => void) | null = null;

export function setFieldConfigChangeCallback(
  callback: (enabledFieldIds: DisplayFieldId[]) => void
): void {
  onFieldConfigChange = callback;
}

// ============================================
// State
// ============================================

export const fieldConfigState: FieldConfigState = $state({
  fields: ALL_FIELDS.map((f) => ({
    ...f,
    isEnabled: DEFAULT_FIELD_IDS.includes(f.id)
  })),
  currentQueryId: null
});

// ============================================
// Actions
// ============================================

/**
 * Load field configuration for a query
 */
export function loadFieldConfig(queryId: string, displayFields?: string[]): void {
  const enabledIds = displayFields || getDefaultFieldIds();

  fieldConfigState.fields = ALL_FIELDS.map((f) => ({
    ...f,
    isEnabled: enabledIds.includes(f.id)
  }));
  fieldConfigState.currentQueryId = queryId;

  logger.debug('Field config loaded for query', { queryId, enabledFields: enabledIds });
}

/**
 * Initialize field configuration with defaults (for new queries or when no query is active)
 */
export function initializeFieldConfig(): void {
  const defaultIds = getDefaultFieldIds();
  fieldConfigState.fields = ALL_FIELDS.map((f) => ({
    ...f,
    isEnabled: defaultIds.includes(f.id)
  }));
  fieldConfigState.currentQueryId = null;
  logger.debug('Field config initialized with defaults');
}

/**
 * Toggle a field's visibility
 */
export function toggleField(fieldId: DisplayFieldId): void {
  const field = fieldConfigState.fields.find((f) => f.id === fieldId);
  if (field) {
    field.isEnabled = !field.isEnabled;
    notifyChange();
    logger.debug(`Field "${fieldId}" toggled to ${field.isEnabled}`);
  }
}

/**
 * Set a field's visibility directly
 */
export function setFieldEnabled(fieldId: DisplayFieldId, isEnabled: boolean): void {
  const field = fieldConfigState.fields.find((f) => f.id === fieldId);
  if (field && field.isEnabled !== isEnabled) {
    field.isEnabled = isEnabled;
    notifyChange();
  }
}

/**
 * Get enabled field IDs
 */
export function getEnabledFieldIds(): DisplayFieldId[] {
  return fieldConfigState.fields.filter((f) => f.isEnabled).map((f) => f.id);
}

/**
 * Check if a specific field is enabled
 */
export function isFieldEnabled(fieldId: DisplayFieldId): boolean {
  return fieldConfigState.fields.find((f) => f.id === fieldId)?.isEnabled ?? false;
}

/**
 * Reset to default configuration
 */
export function resetFieldConfig(): void {
  const defaultIds = getDefaultFieldIds();
  fieldConfigState.fields = ALL_FIELDS.map((f) => ({
    ...f,
    isEnabled: defaultIds.includes(f.id)
  }));
  notifyChange();
  logger.info('Field config reset to defaults');
}

/**
 * Export field configuration (returns enabled field IDs)
 */
export function exportFieldConfig(): DisplayFieldId[] {
  return getEnabledFieldIds();
}

// ============================================
// Internal
// ============================================

function notifyChange(): void {
  if (onFieldConfigChange) {
    onFieldConfigChange(getEnabledFieldIds());
  }
}
