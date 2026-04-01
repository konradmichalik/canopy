/**
 * LocalStorage Wrapper with Type Safety
 * All keys are prefixed with 'jira-hierarchy:' for namespacing
 *
 * Supports both Browser (localStorage) and Tauri (plugin-store) platforms.
 */

import { logger } from './logger';
import type { ExportedConfig, ExportedSingleQuery, SavedQuery, QueryListItem } from '../types';
import type { StoredConnection } from '../types/connection';

const STORAGE_PREFIX = 'jira-hierarchy:';

// ============================================
// Platform Detection
// ============================================

/**
 * Check if running in Tauri desktop environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Lazy-loaded Tauri store instance
let tauriStorePromise: Promise<import('@tauri-apps/plugin-store').Store> | null = null;

/**
 * Get the Tauri store instance (lazy-loaded)
 */
async function getTauriStore(): Promise<import('@tauri-apps/plugin-store').Store> {
  if (!tauriStorePromise) {
    tauriStorePromise = (async () => {
      const { load } = await import('@tauri-apps/plugin-store');
      return load('settings.json', { defaults: {} });
    })();
  }
  return tauriStorePromise;
}

export const STORAGE_KEYS = {
  CONNECTION: 'connection',
  CONNECTIONS: 'connections',
  QUERIES: 'queries',
  THEME: 'theme',
  EXPANDED_NODES: 'expanded-nodes',
  LAST_QUERY_ID: 'last-query-id',
  SIDEBAR_OPEN: 'sidebar-open',
  SIDEBAR_WIDTH: 'sidebar-width',
  DISPLAY_FIELDS: 'display-fields',
  DISPLAY_DENSITY: 'display-density',
  DEBUG_MODE: 'debug-mode',
  GROUP_BY: 'group-by',
  HELP_MODAL_SEEN: 'help-modal-seen',
  DATE_FORMAT: 'date-format',
  AUTO_REFRESH_INTERVAL: 'auto-refresh-interval',
  CHANGE_TRACKING_ENABLED: 'change-tracking-enabled',
  CHANGE_TRACKING_ACTIVITY_PERIOD: 'change-tracking-activity-period',
  CHANGE_TRACKING_CHECKPOINTS: 'change-tracking-checkpoints',
  CHANGE_TRACKING_PENDING_CHANGES: 'change-tracking-pending-changes',
  CHANGE_TRACKING_SHOW_INDICATORS: 'change-tracking-show-indicators',
  CHANGE_TRACKING_EXCLUDE_OWN: 'change-tracking-exclude-own',
  CHANGE_TRACKING_OWN_CACHE: 'change-tracking-own-cache',
  CHANGE_TRACKING_STALE_DAYS: 'change-tracking-stale-days',
  CUSTOM_FILTERS: 'custom-filters',
  UPDATE_LAST_CHECKED: 'update-last-checked',
  UPDATE_DISMISSED_VERSION: 'update-dismissed-version',
  DEFAULT_FIELDS: 'default-fields',
  DEFAULT_SORT: 'default-sort',
  AUTO_EXPAND_DEPTH: 'auto-expand-depth',
  FLAGS: 'flags',
  COLOR_INTENSITY: 'color-intensity'
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ============================================
// Async Storage Functions (Platform-Aware)
// ============================================

/**
 * Get a value from storage (async, supports Tauri and Browser)
 * In Tauri: Falls back to localStorage for migration from browser version
 */
export async function getStorageItemAsync<T>(key: StorageKey): Promise<T | null> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (isTauri()) {
      const store = await getTauriStore();
      const value = await store.get<T>(fullKey);
      if (value !== undefined && value !== null) {
        logger.debug(`Storage (Tauri): loaded "${key}"`, value);
        return value;
      }

      // Fallback: Check localStorage for migration from browser/dev version
      const localValue = getStorageItem<T>(key);
      if (localValue !== null) {
        // Migrate to Tauri store
        await store.set(fullKey, localValue);
        await store.save();
        logger.info(`Storage (Tauri): migrated "${key}" from localStorage`);
        return localValue;
      }

      return null;
    }

    // Browser fallback
    return getStorageItem<T>(key);
  } catch (error) {
    logger.error(`Storage: failed to load "${key}"`, error);
    return null;
  }
}

/**
 * Set a value in storage (async, supports Tauri and Browser)
 */
export async function setStorageItemAsync<T>(key: StorageKey, value: T): Promise<boolean> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (isTauri()) {
      const store = await getTauriStore();
      await store.set(fullKey, value);
      await store.save(); // Persist to disk
      logger.debug(`Storage (Tauri): saved "${key}"`, value);
      return true;
    }

    // Browser fallback
    return setStorageItem(key, value);
  } catch (error) {
    logger.error(`Storage: failed to save "${key}"`, error);
    return false;
  }
}

/**
 * Remove a value from storage (async, supports Tauri and Browser)
 */
export async function removeStorageItemAsync(key: StorageKey): Promise<boolean> {
  const fullKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (isTauri()) {
      const store = await getTauriStore();
      await store.delete(fullKey);
      await store.save(); // Persist to disk
      logger.debug(`Storage (Tauri): removed "${key}"`);
      return true;
    }

    // Browser fallback
    return removeStorageItem(key);
  } catch (error) {
    logger.error(`Storage: failed to remove "${key}"`, error);
    return false;
  }
}

/**
 * Save to storage without waiting (fire and forget)
 * Use for non-blocking saves where completion isn't critical
 */
export function saveStorage<T>(key: StorageKey, value: T): void {
  void setStorageItemAsync(key, value);
}

/**
 * Remove from storage without waiting (fire and forget)
 */
export function removeStorage(key: StorageKey): void {
  void removeStorageItemAsync(key);
}

// ============================================
// Sync Storage Functions (Browser Only)
// ============================================

/**
 * Get a value from localStorage (sync, browser only)
 */
export function getStorageItem<T>(key: StorageKey): T | null {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const item = localStorage.getItem(fullKey);

    if (item === null) {
      return null;
    }

    const parsed = JSON.parse(item) as T;
    logger.debug(`Storage: loaded "${key}"`, parsed);
    return parsed;
  } catch (error) {
    logger.error(`Storage: failed to load "${key}"`, error);
    return null;
  }
}

/**
 * Set a value in localStorage
 */
export function setStorageItem<T>(key: StorageKey, value: T): boolean {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const serialized = JSON.stringify(value);
    localStorage.setItem(fullKey, serialized);
    logger.debug(`Storage: saved "${key}"`, value);
    return true;
  } catch (error) {
    logger.error(`Storage: failed to save "${key}"`, error);
    return false;
  }
}

/**
 * Remove a value from localStorage
 */
export function removeStorageItem(key: StorageKey): boolean {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    logger.debug(`Storage: removed "${key}"`);
    return true;
  } catch (error) {
    logger.error(`Storage: failed to remove "${key}"`, error);
    return false;
  }
}

/**
 * Clear all jira-hierarchy storage items
 */
export function clearStorage(): boolean {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    logger.info(`Storage: cleared ${keysToRemove.length} items`);
    return true;
  } catch (error) {
    logger.error('Storage: failed to clear', error);
    return false;
  }
}

/**
 * Keys that are considered temporary/cache data
 * These can be cleared without losing user configuration
 */
const TEMPORARY_STORAGE_KEYS: StorageKey[] = [
  STORAGE_KEYS.EXPANDED_NODES,
  STORAGE_KEYS.LAST_QUERY_ID,
  STORAGE_KEYS.SIDEBAR_OPEN,
  STORAGE_KEYS.SIDEBAR_WIDTH,
  STORAGE_KEYS.GROUP_BY,
  STORAGE_KEYS.HELP_MODAL_SEEN,
  STORAGE_KEYS.CHANGE_TRACKING_CHECKPOINTS,
  STORAGE_KEYS.CHANGE_TRACKING_PENDING_CHANGES,
  STORAGE_KEYS.CHANGE_TRACKING_OWN_CACHE,
  STORAGE_KEYS.UPDATE_LAST_CHECKED,
  STORAGE_KEYS.UPDATE_DISMISSED_VERSION
];

export interface ClearCacheOptions {
  keepFlags?: boolean;
}

/**
 * Clear temporary/cache data while preserving user configuration
 * Returns the number of items cleared
 */
export async function clearTemporaryData(options: ClearCacheOptions = {}): Promise<number> {
  const { keepFlags = true } = options;

  const keysToClear = [...TEMPORARY_STORAGE_KEYS];
  if (!keepFlags) {
    keysToClear.push(STORAGE_KEYS.FLAGS);
  }

  let cleared = 0;

  for (const key of keysToClear) {
    const success = await removeStorageItemAsync(key);
    if (success) {
      cleared++;
    }
  }

  logger.info(`Cache cleared: ${cleared} items removed`, {
    keepFlags,
    keys: keysToClear
  });

  return cleared;
}

/**
 * Get list of temporary storage keys that have data
 */
export async function getTemporaryDataInfo(): Promise<{ key: string; hasData: boolean }[]> {
  const result: { key: string; hasData: boolean }[] = [];

  for (const key of TEMPORARY_STORAGE_KEYS) {
    const value = await getStorageItemAsync(key);
    result.push({ key, hasData: value !== null });
  }

  // Check flags separately
  const flags = await getStorageItemAsync(STORAGE_KEYS.FLAGS);
  result.push({ key: STORAGE_KEYS.FLAGS, hasData: flags !== null });

  return result;
}

/**
 * Calculate total size of cached/temporary data in bytes
 * Returns size in bytes and formatted string
 */
export async function getCacheSize(): Promise<{ bytes: number; formatted: string }> {
  let totalBytes = 0;

  for (const key of TEMPORARY_STORAGE_KEYS) {
    const fullKey = `${STORAGE_PREFIX}${key}`;

    if (isTauri()) {
      try {
        const store = await getTauriStore();
        const value = await store.get(fullKey);
        if (value !== null && value !== undefined) {
          totalBytes += JSON.stringify(value).length * 2; // UTF-16 = 2 bytes per char
        }
      } catch {
        // Ignore errors
      }
    } else {
      const item = localStorage.getItem(fullKey);
      if (item) {
        totalBytes += item.length * 2; // UTF-16 = 2 bytes per char
      }
    }
  }

  // Also count flags
  const flagsKey = `${STORAGE_PREFIX}${STORAGE_KEYS.FLAGS}`;
  if (isTauri()) {
    try {
      const store = await getTauriStore();
      const value = await store.get(flagsKey);
      if (value !== null && value !== undefined) {
        totalBytes += JSON.stringify(value).length * 2;
      }
    } catch {
      // Ignore errors
    }
  } else {
    const item = localStorage.getItem(flagsKey);
    if (item) {
      totalBytes += item.length * 2;
    }
  }

  // Format size
  let formatted: string;
  if (totalBytes < 1024) {
    formatted = `${totalBytes} B`;
  } else if (totalBytes < 1024 * 1024) {
    formatted = `${(totalBytes / 1024).toFixed(1)} KB`;
  } else {
    formatted = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return { bytes: totalBytes, formatted };
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; keys: string[] } {
  const keys: string[] = [];
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ''));
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }

  return { used, keys };
}

// ============================================
// Connection Helpers
// ============================================

/**
 * Derive a human-readable label from a Jira base URL.
 */
export function deriveLabelFromUrl(baseUrl: string): string {
  try {
    const hostname = new URL(baseUrl).hostname;
    const name = hostname.replace('.atlassian.net', '').replace(/\./g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Jira';
  }
}

// ============================================
// Connection Registry Migration
// ============================================

/**
 * Old single-connection format (pre-registry)
 */
interface LegacyStoredConnection {
  instanceType: 'cloud' | 'server';
  baseUrl: string;
  credentials: StoredConnection['credentials'];
  proxyUrl?: string;
  lastConnected?: string;
}

/**
 * Migrate from single CONNECTION key to CONNECTIONS array.
 * Idempotent: skips if CONNECTIONS already exists.
 * Must run before connection registry initialization.
 */
export async function migrateConnectionToRegistry(): Promise<void> {
  const connections = await getStorageItemAsync<StoredConnection[]>(STORAGE_KEYS.CONNECTIONS);

  // Already migrated or fresh install
  if (connections !== null) {
    return;
  }

  const legacy = await getStorageItemAsync<LegacyStoredConnection>(STORAGE_KEYS.CONNECTION);
  if (!legacy) {
    return; // Fresh install, nothing to migrate
  }

  const label = deriveLabelFromUrl(legacy.baseUrl);

  const connectionId = crypto.randomUUID();
  const migratedConnection: StoredConnection = {
    id: connectionId,
    label,
    instanceType: legacy.instanceType,
    baseUrl: legacy.baseUrl,
    credentials: legacy.credentials,
    proxyUrl: legacy.proxyUrl,
    lastConnected: legacy.lastConnected
  };

  // Stamp all queries and separators with the connectionId
  const items = await getStorageItemAsync<QueryListItem[]>(STORAGE_KEYS.QUERIES);
  if (items && Array.isArray(items)) {
    const stamped = items.map((item) => ({ ...item, connectionId }));
    await setStorageItemAsync(STORAGE_KEYS.QUERIES, stamped);
  }

  // Write new connections array
  await setStorageItemAsync(STORAGE_KEYS.CONNECTIONS, [migratedConnection]);

  // Remove old key (crash-safe: if this fails, next load sees CONNECTIONS and skips)
  await removeStorageItemAsync(STORAGE_KEYS.CONNECTION);

  logger.info('Migrated single connection to registry', { connectionId, label });
}

// ============================================
// Export / Import Configuration
// ============================================

const EXPORT_VERSION = 1;

export interface ExportOptions {
  includeCredentials?: boolean;
}

/**
 * Export current configuration as JSON
 * Note: displayFields are stored per query, not globally
 */
export function exportConfig(options: ExportOptions = {}): ExportedConfig {
  const { includeCredentials = true } = options;
  const connections = getStorageItem<StoredConnection[]>(STORAGE_KEYS.CONNECTIONS) || [];
  const queries = getStorageItem<SavedQuery[]>(STORAGE_KEYS.QUERIES) || [];

  const exportedConnections = includeCredentials
    ? connections.map((conn) => ({
        id: conn.id,
        label: conn.label,
        instanceType: conn.instanceType,
        baseUrl: conn.baseUrl,
        credentials: conn.credentials,
        proxyUrl: conn.proxyUrl,
        color: conn.color
      }))
    : undefined;

  const config: ExportedConfig = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    connections: exportedConnections,
    queries
  };

  logger.info('Config exported', {
    connectionCount: connections.length,
    includeCredentials,
    queryCount: queries.length
  });

  return config;
}

/**
 * Download configuration as JSON file
 */
export function downloadConfig(options: ExportOptions = {}): void {
  const config = exportConfig(options);
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const suffix = options.includeCredentials === false ? '-queries-only' : '';
  const filename = `canopy-config${suffix}-${new Date().toISOString().split('T')[0]}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info(`📥 Config downloaded as "${filename}"`);
}

/**
 * Validate imported configuration
 */
export function validateImportedConfig(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON structure'] };
  }

  const config = data as Record<string, unknown>;

  // Check version
  if (typeof config.version !== 'number') {
    errors.push('Missing or invalid version field');
  } else if (config.version > EXPORT_VERSION) {
    errors.push(
      `Config version ${config.version} is newer than supported version ${EXPORT_VERSION}`
    );
  }

  // Check queries
  if (config.queries !== undefined && !Array.isArray(config.queries)) {
    errors.push('Queries must be an array');
  } else if (Array.isArray(config.queries)) {
    config.queries.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item at index ${index} is invalid`);
      } else {
        const q = item as Record<string, unknown>;
        // Separators only need a title
        if (q.type === 'separator') {
          if (typeof q.title !== 'string' || !q.title) {
            errors.push(`Separator at index ${index} is missing title`);
          }
        } else {
          // Queries need both title and JQL
          if (typeof q.title !== 'string' || !q.title) {
            errors.push(`Query at index ${index} is missing title`);
          }
          if (typeof q.jql !== 'string' || !q.jql) {
            errors.push(`Query at index ${index} is missing JQL`);
          }
        }
      }
    });
  }

  // Check connections (array format) or legacy connection (single object)
  const validateSingleConnection = (conn: Record<string, unknown>, label: string) => {
    if (!conn.baseUrl || typeof conn.baseUrl !== 'string') {
      errors.push(`${label} is missing baseUrl`);
    }
    if (!conn.instanceType || !['cloud', 'server'].includes(conn.instanceType as string)) {
      errors.push(`${label} has invalid instanceType`);
    }
    if (!conn.credentials || typeof conn.credentials !== 'object') {
      errors.push(`${label} is missing credentials`);
    }
  };

  if (Array.isArray(config.connections)) {
    config.connections.forEach((conn, i) => {
      if (!conn || typeof conn !== 'object') {
        errors.push(`Connection at index ${i} is invalid`);
      } else {
        validateSingleConnection(conn as Record<string, unknown>, `Connection ${i}`);
      }
    });
  } else if (config.connection !== null && config.connection !== undefined) {
    if (typeof config.connection !== 'object') {
      errors.push('Connection must be an object');
    } else {
      validateSingleConnection(config.connection as Record<string, unknown>, 'Connection');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Import configuration from JSON
 * Note: displayFields are stored per query, not globally
 */
export function importConfig(
  config: ExportedConfig,
  options: {
    overwriteConnection?: boolean;
    overwriteQueries?: boolean;
    mergeQueries?: boolean;
  } = {}
): {
  success: boolean;
  imported: { connection: boolean; queriesCount: number };
} {
  const { overwriteConnection = true, overwriteQueries = false, mergeQueries = true } = options;

  let connectionImported = false;
  let queriesImported = 0;

  // Import connections (new multi-connection format or legacy single connection)
  if (overwriteConnection) {
    if (config.connections && config.connections.length > 0) {
      // Multi-connection format
      const storedConnections: StoredConnection[] = config.connections.map((conn) => ({
        id: conn.id,
        label: conn.label || deriveLabelFromUrl(conn.baseUrl),
        instanceType: conn.instanceType,
        baseUrl: conn.baseUrl,
        credentials: conn.credentials as StoredConnection['credentials'],
        proxyUrl: conn.proxyUrl,
        color: conn.color
      }));
      setStorageItem(STORAGE_KEYS.CONNECTIONS, storedConnections);
      connectionImported = true;
      logger.info('Connections imported', { count: storedConnections.length });
    } else if (config.connection) {
      // Legacy single connection format → convert to array
      const connectionId = crypto.randomUUID();
      const label = deriveLabelFromUrl(config.connection.baseUrl);
      const storedConnection: StoredConnection = {
        id: connectionId,
        label,
        instanceType: config.connection.instanceType,
        baseUrl: config.connection.baseUrl,
        credentials: config.connection.credentials as StoredConnection['credentials'],
        proxyUrl: config.connection.proxyUrl
      };
      setStorageItem(STORAGE_KEYS.CONNECTIONS, [storedConnection]);
      connectionImported = true;
      logger.info('Legacy connection imported as registry', { baseUrl: config.connection.baseUrl });
    }
  }

  // Import queries and separators (including their displayFields)
  if (config.queries && config.queries.length > 0) {
    const existingItems = getStorageItem<QueryListItem[]>(STORAGE_KEYS.QUERIES) || [];

    let newItems: QueryListItem[];

    if (overwriteQueries) {
      // Replace all items
      newItems = config.queries.map(normalizeImportedItem);
      queriesImported = newItems.length;
    } else if (mergeQueries) {
      // Merge: add new items, skip duplicates by title (for items that have titles)
      const existingTitles = new Set(
        existingItems
          .filter((item) => 'title' in item && item.title)
          .map((item) => (item.title ?? '').toLowerCase())
      );
      const toAdd = config.queries
        .filter((item) => {
          const title = 'title' in item ? item.title : undefined;
          return !title || !existingTitles.has(title.toLowerCase());
        })
        .map(normalizeImportedItem);
      newItems = [...existingItems, ...toAdd];
      queriesImported = toAdd.length;
    } else {
      // Keep existing
      newItems = existingItems;
    }

    setStorageItem(STORAGE_KEYS.QUERIES, newItems);
    logger.info(`📋 Items imported: ${queriesImported} new items`);
  }

  logger.info('✅ Config import completed', {
    connectionImported,
    queriesImported
  });

  return {
    success: true,
    imported: {
      connection: connectionImported,
      queriesCount: queriesImported
    }
  };
}

/**
 * Normalize an imported query or separator (ensure all required fields)
 */
function normalizeImportedItem(item: QueryListItem): QueryListItem {
  const now = new Date().toISOString();

  // For separators, only normalize the separator-specific fields
  if (item.type === 'separator') {
    return {
      ...item,
      id: item.id || `separator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now
    };
  }

  // For queries, normalize all query fields
  return {
    ...item,
    id: item.id || `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: item.title,
    jql: item.jql,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    isDefault: item.isDefault || false
  };
}

/**
 * Read a file and parse as JSON
 */
export function readConfigFile(file: File): Promise<ExportedConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const validation = validateImportedConfig(data);
        if (!validation.valid) {
          reject(new Error(`Invalid config file: ${validation.errors.join(', ')}`));
          return;
        }

        resolve(data as ExportedConfig);
      } catch {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// ============================================
// Single Query Export / Import
// ============================================

const SINGLE_QUERY_EXPORT_VERSION = 1;

/**
 * Export a single query as JSON
 */
export function exportSingleQuery(query: SavedQuery): ExportedSingleQuery {
  const config: ExportedSingleQuery = {
    version: SINGLE_QUERY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    type: 'single-query',
    query
  };

  logger.info('📦 Single query exported', { title: query.title });

  return config;
}

/**
 * Download a single query as JSON file
 */
export function downloadSingleQuery(query: SavedQuery): void {
  const config = exportSingleQuery(query);
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Sanitize title for filename
  const safeTitle = query.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `jira-query-${safeTitle}-${new Date().toISOString().split('T')[0]}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info(`📥 Single query downloaded as "${filename}"`);
}

/**
 * Validate an imported single query configuration
 */
export function validateSingleQueryImport(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON structure'] };
  }

  const config = data as Record<string, unknown>;

  // Check type field
  if (config.type !== 'single-query') {
    return { valid: false, errors: ['Not a single query export file'] };
  }

  // Check version
  if (typeof config.version !== 'number') {
    errors.push('Missing or invalid version field');
  } else if (config.version > SINGLE_QUERY_EXPORT_VERSION) {
    errors.push(
      `Config version ${config.version} is newer than supported version ${SINGLE_QUERY_EXPORT_VERSION}`
    );
  }

  // Check query
  if (!config.query || typeof config.query !== 'object') {
    errors.push('Missing query data');
  } else {
    const query = config.query as Record<string, unknown>;
    if (typeof query.title !== 'string' || !query.title) {
      errors.push('Query is missing title');
    }
    if (typeof query.jql !== 'string' || !query.jql) {
      errors.push('Query is missing JQL');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Read a single query file and parse as JSON
 */
export function readSingleQueryFile(file: File): Promise<ExportedSingleQuery> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        const validation = validateSingleQueryImport(data);
        if (!validation.valid) {
          reject(new Error(`Invalid query file: ${validation.errors.join(', ')}`));
          return;
        }

        resolve(data as ExportedSingleQuery);
      } catch {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import a single query from an exported file
 * Returns the normalized query ready to be added to the store
 */
export function importSingleQuery(config: ExportedSingleQuery): SavedQuery {
  const now = new Date().toISOString();

  const importedQuery: SavedQuery = {
    ...config.query,
    id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: config.query.createdAt || now,
    updatedAt: now,
    isDefault: false // Never import as default
  };

  logger.info('📋 Single query imported', { title: importedQuery.title });

  return importedQuery;
}
