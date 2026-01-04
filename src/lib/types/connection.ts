/**
 * Connection and Authentication Types
 */

import type { JiraUser } from './jira';

// ============================================
// Instance Types
// ============================================

export type JiraInstanceType = 'cloud' | 'server';

// ============================================
// Credentials
// ============================================

export interface CloudCredentials {
  type: 'cloud';
  email: string;
  apiToken: string;
}

export interface ServerCredentials {
  type: 'server';
  authMethod: 'basic' | 'pat';
  username?: string;
  password?: string;
  personalAccessToken?: string;
}

export type JiraCredentials = CloudCredentials | ServerCredentials;

// ============================================
// Connection Configuration
// ============================================

export interface JiraConnectionConfig {
  instanceType: JiraInstanceType;
  baseUrl: string;
  credentials: JiraCredentials;
  proxyUrl?: string; // Optional proxy for CORS
}

// ============================================
// Connection State
// ============================================

export interface ConnectionState {
  config: JiraConnectionConfig | null;
  isConnected: boolean;
  isConnecting: boolean;
  currentUser: JiraUser | null;
  error: string | null;
  lastConnected: string | null;
}

// ============================================
// Stored Configuration (for LocalStorage)
// ============================================

export interface StoredConnection {
  instanceType: JiraInstanceType;
  baseUrl: string;
  credentials: JiraCredentials;
  proxyUrl?: string;
  lastConnected?: string;
}

// ============================================
// Form Types
// ============================================

export interface ConnectionFormData {
  instanceType: JiraInstanceType;
  baseUrl: string;
  email: string;
  apiToken: string;
  username: string;
  password: string;
  personalAccessToken: string;
  authMethod: 'basic' | 'pat';
  proxyUrl: string;
}

// ============================================
// Validation
// ============================================

export function isValidCloudUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.atlassian.net');
  } catch {
    return false;
  }
}

export function isValidServerUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateConnectionConfig(config: JiraConnectionConfig): string[] {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  } else if (config.instanceType === 'cloud' && !isValidCloudUrl(config.baseUrl)) {
    errors.push('Cloud URL must end with .atlassian.net');
  } else if (!isValidServerUrl(config.baseUrl)) {
    errors.push('Invalid URL format');
  }

  if (config.credentials.type === 'cloud') {
    if (!config.credentials.email) {
      errors.push('Email is required for Cloud authentication');
    }
    if (!config.credentials.apiToken) {
      errors.push('API Token is required for Cloud authentication');
    }
  } else {
    if (config.credentials.authMethod === 'basic') {
      if (!config.credentials.username) {
        errors.push('Username is required for Basic authentication');
      }
      if (!config.credentials.password) {
        errors.push('Password is required for Basic authentication');
      }
    } else if (!config.credentials.personalAccessToken) {
      errors.push('Personal Access Token is required');
    }
  }

  return errors;
}
