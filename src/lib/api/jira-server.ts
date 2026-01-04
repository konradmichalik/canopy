/**
 * JIRA Server/Data Center API Client
 * Uses API v2 with Basic Auth or Personal Access Token
 */

import type { JiraUser, ServerCredentials } from '../types';
import { JiraClient, type JiraClientOptions } from './jira-client';

export class JiraServerClient extends JiraClient {
  private credentials: ServerCredentials;

  constructor(options: JiraClientOptions) {
    super(options);
    this.credentials = options.config.credentials as ServerCredentials;
  }

  protected get apiPath(): string {
    return '/rest/api/2';
  }

  protected getAuthHeader(): string {
    if (this.credentials.authMethod === 'pat') {
      return `Bearer ${this.credentials.personalAccessToken}`;
    }

    // Basic Auth
    const token = btoa(`${this.credentials.username}:${this.credentials.password}`);
    return `Basic ${token}`;
  }

  async getCurrentUser(): Promise<JiraUser> {
    // Server API uses /myself endpoint as well
    return this.request<JiraUser>('GET', '/myself');
  }
}
