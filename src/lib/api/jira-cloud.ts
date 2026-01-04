/**
 * JIRA Cloud API Client
 * Uses API v3 with email:apiToken authentication
 */

import type { JiraUser, CloudCredentials } from '../types';
import { JiraClient, type JiraClientOptions } from './jira-client';

export class JiraCloudClient extends JiraClient {
  private credentials: CloudCredentials;

  constructor(options: JiraClientOptions) {
    super(options);
    this.credentials = options.config.credentials as CloudCredentials;
  }

  protected get apiPath(): string {
    return '/rest/api/3';
  }

  protected getAuthHeader(): string {
    const token = btoa(`${this.credentials.email}:${this.credentials.apiToken}`);
    return `Basic ${token}`;
  }

  async getCurrentUser(): Promise<JiraUser> {
    return this.request<JiraUser>('GET', '/myself');
  }

  /**
   * In JIRA Cloud, Epic hierarchy is handled via the parent field
   * No need to find a custom Epic Link field
   */
  async findEpicLinkFieldId(): Promise<string | null> {
    // Cloud uses parent field for Epic relationships
    return null;
  }
}
