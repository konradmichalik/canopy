/**
 * JIRA API Module Exports
 */

import type { JiraConnectionConfig } from '../types';
import { JiraClient, JiraApiError } from './jira-client';
import { JiraCloudClient } from './jira-cloud';
import { JiraServerClient } from './jira-server';

export { JiraClient, JiraApiError } from './jira-client';
export { JiraCloudClient } from './jira-cloud';
export { JiraServerClient } from './jira-server';

/**
 * Create a JIRA client based on configuration
 */
export function createJiraClient(
  config: JiraConnectionConfig,
  epicLinkFieldId?: string
): JiraClient {
  const options = { config, epicLinkFieldId };

  if (config.instanceType === 'cloud') {
    return new JiraCloudClient(options);
  }

  return new JiraServerClient(options);
}

/**
 * Detect instance type from URL
 */
export function detectInstanceType(url: string): 'cloud' | 'server' | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.atlassian.net')) {
      return 'cloud';
    }
    return 'server';
  } catch {
    return null;
  }
}
