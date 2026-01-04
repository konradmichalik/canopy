/**
 * JIRA API Client
 * Factory pattern for Cloud and Server/Data Center clients
 */

import type {
  JiraConnectionConfig,
  JiraSearchResponse,
  JiraUser,
  JiraIssue,
  JiraFieldsResponse
} from '../types';
import { logger } from '../utils/logger';

// Fields to request for issue queries
export const DEFAULT_FIELDS = [
  'summary',
  'status',
  'issuetype',
  'priority',
  'assignee',
  'reporter',
  'created',
  'updated',
  'parent',
  'subtasks',
  'issuelinks',
  'project',
  'resolution',
  'resolutiondate',
  'progress',
  'aggregateprogress',
  'labels',
  'components'
];

export interface JiraClientOptions {
  config: JiraConnectionConfig;
  epicLinkFieldId?: string; // For Server: customfield_XXXXX
}

export interface SearchOptions {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export abstract class JiraClient {
  protected config: JiraConnectionConfig;
  protected epicLinkFieldId?: string;

  constructor(options: JiraClientOptions) {
    this.config = options.config;
    this.epicLinkFieldId = options.epicLinkFieldId;
  }

  protected get baseUrl(): string {
    // Use proxy URL if configured, otherwise direct URL
    return this.config.proxyUrl || this.config.baseUrl;
  }

  protected abstract get apiPath(): string;
  protected abstract getAuthHeader(): string;

  protected async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${this.apiPath}${endpoint}`;
    const timer = logger.time(`${method} ${endpoint}`);

    const headers: HeadersInit = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Atlassian-Token': 'no-check' // Bypass XSRF check for API requests
    };

    logger.apiRequest(method, endpoint, body ? { body } : undefined);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const duration = timer();
      const data = await response.json();

      if (!response.ok) {
        logger.apiError(method, endpoint, { status: response.status, data });
        throw new JiraApiError(
          data.errorMessages?.join(', ') || 'API request failed',
          response.status,
          data
        );
      }

      logger.apiResponse(method, endpoint, response.status, duration, {
        dataKeys: Object.keys(data)
      });

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof JiraApiError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        logger.apiError(method, endpoint, 'Request timed out');
        throw new JiraApiError('Request timed out after 30 seconds', 0, error);
      }

      logger.apiError(method, endpoint, error);
      throw new JiraApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        error
      );
    }
  }

  /**
   * Get current authenticated user
   */
  abstract getCurrentUser(): Promise<JiraUser>;

  /**
   * Search issues with JQL
   */
  async searchIssues(options: SearchOptions): Promise<JiraSearchResponse> {
    const { jql, startAt = 0, maxResults = 100, fields = DEFAULT_FIELDS } = options;

    // Include Epic Link field for Server instances
    const allFields = this.epicLinkFieldId
      ? [...fields, this.epicLinkFieldId]
      : fields;

    return this.request<JiraSearchResponse>('POST', '/search', {
      jql,
      startAt,
      maxResults,
      fields: allFields
    });
  }

  /**
   * Fetch all issues matching JQL (handles pagination)
   */
  async fetchAllIssues(jql: string, fields?: string[]): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100;
    let total = 0;

    logger.info(`Fetching all issues for JQL: ${jql}`);

    do {
      const response = await this.searchIssues({
        jql,
        startAt,
        maxResults,
        fields
      });

      allIssues.push(...response.issues);
      total = response.total;
      startAt += response.issues.length;

      logger.debug(`Fetched ${allIssues.length}/${total} issues`);
    } while (allIssues.length < total);

    logger.info(`Fetched ${allIssues.length} issues total`);
    return allIssues;
  }

  /**
   * Get available fields (for finding Epic Link field)
   */
  async getFields(): Promise<JiraFieldsResponse[]> {
    return this.request<JiraFieldsResponse[]>('GET', '/field');
  }

  /**
   * Find the Epic Link field ID (Server/DC only)
   */
  async findEpicLinkFieldId(): Promise<string | null> {
    try {
      const fields = await this.getFields();
      const epicLinkField = fields.find(
        (f) =>
          f.name === 'Epic Link' ||
          f.schema?.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'
      );
      return epicLinkField?.id || null;
    } catch {
      logger.warn('Could not find Epic Link field');
      return null;
    }
  }

  /**
   * Get a single issue by key
   */
  async getIssue(issueKey: string, fields?: string[]): Promise<JiraIssue> {
    const allFields = fields || DEFAULT_FIELDS;
    const fieldsParam = allFields.join(',');
    return this.request<JiraIssue>('GET', `/issue/${issueKey}?fields=${fieldsParam}`);
  }

  /**
   * Test connection by fetching current user
   */
  async testConnection(): Promise<{ success: boolean; user?: JiraUser; error?: string }> {
    try {
      logger.connection(`Testing connection to ${this.config.baseUrl}`);
      const user = await this.getCurrentUser();
      logger.connectionSuccess(`Connected as ${user.displayName}`);
      return { success: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      logger.error('Connection test failed', error);
      return { success: false, error: message };
    }
  }

  /**
   * Build URL to view issue in JIRA
   */
  getIssueUrl(issueKey: string): string {
    return `${this.config.baseUrl}/browse/${issueKey}`;
  }
}

/**
 * JIRA API Error class
 */
export class JiraApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'JiraApiError';
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isRateLimitError(): boolean {
    return this.status === 429;
  }

  isNotFoundError(): boolean {
    return this.status === 404;
  }
}
