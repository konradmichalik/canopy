/**
 * Connection Registry Store
 * Manages multiple JIRA connections with Svelte 5 Runes
 */

import type { StoredConnection, ConnectionInstance, ConnectionState } from '../types';
import { createJiraClient, type JiraClient } from '../api';
import {
  getStorageItemAsync,
  setStorageItemAsync,
  migrateConnectionToRegistry,
  STORAGE_KEYS
} from '../utils/storage';
import { logger } from '../utils/logger';
import { clearAvatarCache } from '../utils/avatar-cache';

// ============================================
// Registry State
// ============================================

export const connectionRegistry = $state({
  connections: [] as ConnectionInstance[],
  isInitializing: true
});

// Non-reactive client map (keyed by connection ID)
const clients = new Map<string, JiraClient>();

// ============================================
// Backward-compat shim (removed in Phase 6)
// Allows existing consumers to keep using connectionState
// ============================================

function getFirstConnected(): ConnectionInstance | undefined {
  return connectionRegistry.connections.find((c) => c.status === 'connected');
}

/**
 * Backward-compat shim: returns a ConnectionState derived from the first connected instance.
 * Used by MainLayout and SettingsModal. Will be removed once those are migrated.
 */
export function getConnectionState(): ConnectionState {
  const first = getFirstConnected();
  if (first) {
    return {
      config: {
        instanceType: first.config.instanceType,
        baseUrl: first.config.baseUrl,
        credentials: first.config.credentials,
        proxyUrl: first.config.proxyUrl
      },
      isConnected: true,
      isConnecting: false,
      currentUser: first.currentUser,
      error: first.error,
      lastConnected: first.config.lastConnected ?? null
    };
  }
  const connecting = connectionRegistry.connections.find((c) => c.status === 'connecting');
  if (connecting) {
    return {
      config: null,
      isConnected: false,
      isConnecting: true,
      currentUser: null,
      error: null,
      lastConnected: null
    };
  }
  return {
    config: null,
    isConnected: false,
    isConnecting: connectionRegistry.isInitializing,
    currentUser: null,
    error: connectionRegistry.connections[0]?.error ?? null,
    lastConnected: null
  };
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize connection registry from storage.
 * Runs migration first, then connects all stored connections.
 */
export async function initializeConnections(): Promise<void> {
  connectionRegistry.isInitializing = true;

  try {
    // Run migration from old single-connection format
    await migrateConnectionToRegistry();

    const stored = await getStorageItemAsync<StoredConnection[]>(STORAGE_KEYS.CONNECTIONS);
    if (!stored || stored.length === 0) {
      logger.info('No stored connections found');
      return;
    }

    // Initialize instances in disconnected state
    connectionRegistry.connections = stored.map((config) => ({
      id: config.id,
      config,
      status: 'disconnected' as const,
      error: null,
      currentUser: null,
      epicLinkFieldId: null,
      sprintFieldId: null
    }));

    // Connect all in parallel
    await connectAll();
  } finally {
    connectionRegistry.isInitializing = false;
  }
}

// ============================================
// Connection Operations
// ============================================

/**
 * Connect all stored connections in parallel.
 * Failed connections get status 'error', do not block others.
 */
export async function connectAll(): Promise<void> {
  await Promise.all(connectionRegistry.connections.map((conn) => connectSingle(conn.id)));
}

/**
 * Connect a single instance by ID.
 */
export async function connectSingle(connectionId: string): Promise<boolean> {
  const index = connectionRegistry.connections.findIndex((c) => c.id === connectionId);
  if (index === -1) return false;

  const instance = connectionRegistry.connections[index];

  // Sanitize baseUrl
  const config = {
    ...instance.config,
    baseUrl: instance.config.baseUrl.trim().replace(/\/$/, '')
  };

  // Update status to connecting
  connectionRegistry.connections = connectionRegistry.connections.map((c) =>
    c.id === connectionId ? { ...c, status: 'connecting' as const, error: null } : c
  );

  try {
    let client = createJiraClient(config);
    const result = await client.testConnection();

    if (!result.success) {
      throw new Error(result.error || 'Connection failed');
    }

    // Discover custom fields
    let epicLinkFieldId: string | null = null;
    let sprintFieldId: string | null = null;

    sprintFieldId = await client.findSprintFieldId();
    if (config.instanceType === 'server') {
      epicLinkFieldId = await client.findEpicLinkFieldId();
    }

    // Recreate client with discovered fields
    if (epicLinkFieldId || sprintFieldId) {
      client = createJiraClient(config, epicLinkFieldId ?? undefined, sprintFieldId ?? undefined);
    }

    // Store client in non-reactive map
    clients.set(connectionId, client);

    // Update instance state
    const lastConnected = new Date().toISOString();
    connectionRegistry.connections = connectionRegistry.connections.map((c) =>
      c.id === connectionId
        ? {
            ...c,
            config: { ...c.config, baseUrl: config.baseUrl, lastConnected },
            status: 'connected' as const,
            error: null,
            currentUser: result.user!,
            epicLinkFieldId,
            sprintFieldId
          }
        : c
    );

    // Persist updated lastConnected
    await persistConnections();

    logger.connectionSuccess(`[${config.label || connectionId}] Connected as ${result.user!.displayName}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    clients.delete(connectionId);

    connectionRegistry.connections = connectionRegistry.connections.map((c) =>
      c.id === connectionId
        ? {
            ...c,
            status: 'error' as const,
            error: message,
            currentUser: null,
            epicLinkFieldId: null,
            sprintFieldId: null
          }
        : c
    );

    logger.error(`[${instance.config.label || connectionId}] Connection failed`, error);
    return false;
  }
}

/**
 * Add a new connection to the registry.
 * Connects immediately. Returns the connection ID.
 */
export async function addConnection(config: StoredConnection): Promise<string> {
  const id = config.id || crypto.randomUUID();
  const storedConfig: StoredConnection = { ...config, id };

  const instance: ConnectionInstance = {
    id,
    config: storedConfig,
    status: 'disconnected',
    error: null,
    currentUser: null,
    epicLinkFieldId: null,
    sprintFieldId: null
  };

  connectionRegistry.connections = [...connectionRegistry.connections, instance];
  await persistConnections();
  await connectSingle(id);

  return id;
}

/**
 * Remove a connection from the registry.
 * Cleans up client and persists.
 */
export async function removeConnection(connectionId: string): Promise<void> {
  clients.delete(connectionId);
  connectionRegistry.connections = connectionRegistry.connections.filter(
    (c) => c.id !== connectionId
  );
  await persistConnections();
  clearAvatarCache();
  logger.connection(`Removed connection ${connectionId}`);
}

/**
 * Update a connection's config (label, color, credentials, etc.).
 * Reconnects if credentials or URL changed.
 */
export async function updateConnection(
  connectionId: string,
  updates: Partial<StoredConnection>
): Promise<void> {
  const existing = connectionRegistry.connections.find((c) => c.id === connectionId);
  if (!existing) return;

  const needsReconnect =
    updates.baseUrl !== undefined ||
    updates.credentials !== undefined ||
    updates.proxyUrl !== undefined ||
    updates.instanceType !== undefined;

  connectionRegistry.connections = connectionRegistry.connections.map((c) =>
    c.id === connectionId ? { ...c, config: { ...c.config, ...updates } } : c
  );

  await persistConnections();

  if (needsReconnect) {
    clients.delete(connectionId);
    await connectSingle(connectionId);
  }
}

/**
 * Retry a failed connection.
 */
export async function reconnectConnection(connectionId: string): Promise<boolean> {
  return connectSingle(connectionId);
}

/**
 * Disconnect all connections and clear storage.
 */
export async function disconnectAll(): Promise<void> {
  clients.clear();
  connectionRegistry.connections = [];
  await setStorageItemAsync(STORAGE_KEYS.CONNECTIONS, []);
  clearAvatarCache();
  logger.connection('All connections disconnected');
}

// ============================================
// Lookups
// ============================================

/**
 * Get the JIRA client for a connection.
 * No-arg overload returns first connected client (backward compat).
 */
export function getClient(connectionId?: string): JiraClient | null {
  if (connectionId) {
    return clients.get(connectionId) ?? null;
  }
  // Backward compat: return first connected client
  const first = getFirstConnected();
  return first ? clients.get(first.id) ?? null : null;
}

/**
 * Get Epic Link field ID for a connection.
 */
export function getEpicLinkFieldId(connectionId?: string): string | null {
  if (connectionId) {
    return connectionRegistry.connections.find((c) => c.id === connectionId)?.epicLinkFieldId ?? null;
  }
  return getFirstConnected()?.epicLinkFieldId ?? null;
}

/**
 * Get Sprint field ID for a connection.
 */
export function getSprintFieldId(connectionId?: string): string | null {
  if (connectionId) {
    return connectionRegistry.connections.find((c) => c.id === connectionId)?.sprintFieldId ?? null;
  }
  return getFirstConnected()?.sprintFieldId ?? null;
}

/**
 * Get runtime state for a connection.
 */
export function getConnection(connectionId: string): ConnectionInstance | undefined {
  return connectionRegistry.connections.find((c) => c.id === connectionId);
}

/**
 * Get all connections with status 'connected'.
 */
export function getConnectedConnections(): ConnectionInstance[] {
  return connectionRegistry.connections.filter((c) => c.status === 'connected');
}

/**
 * Check if at least one connection is active.
 */
export function isConnected(): boolean {
  return connectionRegistry.connections.some((c) => c.status === 'connected');
}

/**
 * Clear error for a connection.
 */
export function clearError(connectionId?: string): void {
  if (connectionId) {
    connectionRegistry.connections = connectionRegistry.connections.map((c) =>
      c.id === connectionId ? { ...c, error: null } : c
    );
  }
}

/**
 * Fetch an image with authentication.
 * If connectionId is provided, uses that connection's client.
 * Otherwise, tries to match by URL hostname.
 */
export async function fetchImageWithAuth(
  imageUrl: string,
  connectionId?: string
): Promise<string | null> {
  if (connectionId) {
    const client = clients.get(connectionId);
    return client ? client.fetchImageAsBlob(imageUrl) : null;
  }

  // Infer connection from URL hostname
  try {
    const imageHost = new URL(imageUrl).hostname;
    for (const conn of connectionRegistry.connections) {
      if (conn.status === 'connected') {
        const connHost = new URL(conn.config.baseUrl).hostname;
        if (imageHost === connHost || imageHost.endsWith(`.${connHost}`)) {
          const client = clients.get(conn.id);
          if (client) return client.fetchImageAsBlob(imageUrl);
        }
      }
    }
  } catch {
    // URL parsing failed
  }

  // Fallback: try first connected client
  const first = getFirstConnected();
  if (first) {
    const client = clients.get(first.id);
    return client ? client.fetchImageAsBlob(imageUrl) : null;
  }

  return null;
}

// ============================================
// Persistence
// ============================================

async function persistConnections(): Promise<void> {
  const toStore = connectionRegistry.connections.map((c) => c.config);
  await setStorageItemAsync(STORAGE_KEYS.CONNECTIONS, toStore);
}
