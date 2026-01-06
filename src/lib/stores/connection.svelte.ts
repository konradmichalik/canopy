/**
 * Connection Store
 * Manages JIRA connection state with Svelte 5 Runes
 */

import type { JiraConnectionConfig, JiraUser, ConnectionState, StoredConnection } from '../types';
import { createJiraClient, type JiraClient } from '../api';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '../utils/storage';
import { logger } from '../utils/logger';

// State container object
export const connectionState = $state<ConnectionState>({
  config: null,
  isConnected: false,
  isConnecting: false,
  currentUser: null,
  error: null,
  lastConnected: null
});

// Current client instance (not reactive)
let client: JiraClient | null = null;

// Epic Link field ID (for Server instances)
let epicLinkFieldId: string | null = null;

// Sprint field ID (custom field for sprints)
let sprintFieldId: string | null = null;

/**
 * Initialize connection from storage
 */
export async function initializeConnection(): Promise<boolean> {
  const stored = getStorageItem<StoredConnection>(STORAGE_KEYS.CONNECTION);

  if (!stored) {
    logger.info('No stored connection found');
    return false;
  }

  logger.connection('Restoring connection from storage');
  return connect(stored);
}

/**
 * Connect to JIRA instance
 */
export async function connect(config: JiraConnectionConfig): Promise<boolean> {
  connectionState.isConnecting = true;
  connectionState.error = null;

  try {
    client = createJiraClient(config);
    const result = await client.testConnection();

    if (!result.success) {
      throw new Error(result.error || 'Connection failed');
    }

    // Find the Sprint field (both Cloud and Server)
    sprintFieldId = await client.findSprintFieldId();
    if (sprintFieldId) {
      logger.info(`Found Sprint field: ${sprintFieldId}`);
    }

    // For Server instances, find the Epic Link field
    if (config.instanceType === 'server') {
      epicLinkFieldId = await client.findEpicLinkFieldId();
      if (epicLinkFieldId) {
        logger.info(`Found Epic Link field: ${epicLinkFieldId}`);
      }
    }

    // Recreate client with discovered custom fields
    if (epicLinkFieldId || sprintFieldId) {
      client = createJiraClient(config, epicLinkFieldId ?? undefined, sprintFieldId ?? undefined);
    }

    connectionState.config = config;
    connectionState.isConnected = true;
    connectionState.isConnecting = false;
    connectionState.currentUser = result.user!;
    connectionState.error = null;
    connectionState.lastConnected = new Date().toISOString();

    // Persist connection
    const toStore: StoredConnection = {
      ...config,
      lastConnected: connectionState.lastConnected
    };
    setStorageItem(STORAGE_KEYS.CONNECTION, toStore);

    logger.connectionSuccess(`Connected as ${result.user!.displayName}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    connectionState.config = null;
    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    connectionState.currentUser = null;
    connectionState.error = message;
    connectionState.lastConnected = null;
    client = null;
    logger.error('Connection failed', error);
    return false;
  }
}

/**
 * Disconnect from JIRA
 */
export function disconnect(): void {
  connectionState.config = null;
  connectionState.isConnected = false;
  connectionState.isConnecting = false;
  connectionState.currentUser = null;
  connectionState.error = null;
  connectionState.lastConnected = null;
  client = null;
  epicLinkFieldId = null;
  sprintFieldId = null;
  removeStorageItem(STORAGE_KEYS.CONNECTION);
  logger.connection('Disconnected');
}

/**
 * Get the current JIRA client
 */
export function getClient(): JiraClient | null {
  return client;
}

/**
 * Get Epic Link field ID (for Server instances)
 */
export function getEpicLinkFieldId(): string | null {
  return epicLinkFieldId;
}

/**
 * Get Sprint field ID (custom field)
 */
export function getSprintFieldId(): string | null {
  return sprintFieldId;
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return connectionState.isConnected;
}

/**
 * Get connection state
 */
export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Clear error
 */
export function clearError(): void {
  connectionState.error = null;
}
