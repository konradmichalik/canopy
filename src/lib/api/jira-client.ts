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
  'components',
  'comment',
  'sprint' // For sprint grouping (Cloud uses 'sprint', Server may need custom field discovery)
];

export interface JiraClientOptions {
  config: JiraConnectionConfig;
  epicLinkFieldId?: string; // For Server: customfield_XXXXX
  sprintFieldId?: string; // For sprint grouping: customfield_XXXXX
}

export interface SearchOptions {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  nextPageToken?: string; // For Cloud pagination
}

export abstract class JiraClient {
  protected config: JiraConnectionConfig;
  protected epicLinkFieldId?: string;
  protected sprintFieldId?: string;

  constructor(options: JiraClientOptions) {
    this.config = options.config;
    this.epicLinkFieldId = options.epicLinkFieldId;
    this.sprintFieldId = options.sprintFieldId;
  }

  protected get baseUrl(): string {
    // Use proxy URL if configured, otherwise direct URL
    return this.config.proxyUrl || this.config.baseUrl;
  }

  protected abstract get apiPath(): string;
  protected abstract getAuthHeader(): string;

  protected async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${this.apiPath}${endpoint}`;
    const timer = logger.time(`${method} ${endpoint}`);

    const headers: HeadersInit = {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check' // Bypass XSRF check for API requests
    };

    // When using a proxy, send the actual JIRA URL as a header
    // This allows the proxy to forward requests to the correct instance
    if (this.config.proxyUrl) {
      headers['X-Jira-Base-Url'] = this.config.baseUrl;
    }

    logger.apiRequest(method, endpoint, body ? { body } : undefined);
    logger.debug(`Request URL: ${url}`);

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

      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      let data: unknown;

      try {
        data = JSON.parse(responseText);
      } catch {
        // Response is not JSON
        data = { rawResponse: responseText };
      }

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' && data !== null
            ? (data as Record<string, unknown>).errorMessages
              ? ((data as Record<string, unknown>).errorMessages as string[]).join(', ')
              : ((data as Record<string, unknown>).rawResponse as string) || 'API request failed'
            : 'API request failed';

        logger.apiError(method, endpoint, { status: response.status, data });
        throw new JiraApiError(errorMessage, response.status, data);
      }

      logger.apiResponse(method, endpoint, response.status, duration, {
        dataKeys: typeof data === 'object' && data !== null ? Object.keys(data) : []
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
      throw new JiraApiError(error instanceof Error ? error.message : 'Network error', 0, error);
    }
  }

  /**
   * Get current authenticated user
   */
  abstract getCurrentUser(): Promise<JiraUser>;

  /**
   * Search issues with JQL
   * Note: JIRA Cloud now uses /search/jql endpoint with nextPageToken pagination
   */
  async searchIssues(options: SearchOptions): Promise<JiraSearchResponse> {
    const { jql, startAt = 0, maxResults = 100, fields = DEFAULT_FIELDS, nextPageToken } = options;

    // Include discovered custom fields (Epic Link, Sprint)
    const allFields = [...fields];
    if (this.epicLinkFieldId && !allFields.includes(this.epicLinkFieldId)) {
      allFields.push(this.epicLinkFieldId);
    }
    if (this.sprintFieldId && !allFields.includes(this.sprintFieldId)) {
      allFields.push(this.sprintFieldId);
    }

    if (this.config.instanceType === 'cloud') {
      // New Cloud API format
      const body: Record<string, unknown> = {
        jql,
        maxResults,
        fields: allFields
      };

      if (nextPageToken) {
        body.nextPageToken = nextPageToken;
      }

      return this.request<JiraSearchResponse>('POST', '/search/jql', body);
    } else {
      // Server API (old format with startAt)
      return this.request<JiraSearchResponse>('POST', '/search', {
        jql,
        startAt,
        maxResults,
        fields: allFields
      });
    }
  }

  /**
   * Fetch all issues matching JQL (handles pagination)
   */
  async fetchAllIssues(jql: string, fields?: string[]): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    const maxResults = 100;

    logger.info(`Fetching all issues for JQL: ${jql}`);

    if (this.config.instanceType === 'cloud') {
      // Cloud: Use nextPageToken pagination
      let nextPageToken: string | undefined;

      do {
        const response = await this.searchIssues({
          jql,
          maxResults,
          fields,
          nextPageToken
        });

        allIssues.push(...response.issues);
        nextPageToken = response.nextPageToken;

        logger.debug(`Fetched ${allIssues.length} issues so far...`);
      } while (nextPageToken);
    } else {
      // Server: Use startAt pagination
      let startAt = 0;
      let total = 0;

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
    }

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
          f.name === 'Epic Link' || f.schema?.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'
      );
      return epicLinkField?.id || null;
    } catch {
      logger.warn('Could not find Epic Link field');
      return null;
    }
  }

  /**
   * Find the Sprint field ID
   */
  async findSprintFieldId(): Promise<string | null> {
    try {
      const fields = await this.getFields();
      const sprintField = fields.find(
        (f) =>
          f.name === 'Sprint' ||
          f.name === 'Sprints' ||
          f.schema?.custom === 'com.pyxis.greenhopper.jira:gh-sprint'
      );
      if (sprintField) {
        logger.info(`Found Sprint field: ${sprintField.id} (${sprintField.name})`);
      }
      return sprintField?.id || null;
    } catch {
      logger.warn('Could not find Sprint field');
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

  /**
   * Fetch an image with authentication and return as blob URL
   * Used for avatars and other images that require auth
   */
  async fetchImageAsBlob(imageUrl: string): Promise<string | null> {
    try {
      // If using proxy, route through the image proxy endpoint
      let fetchUrl = imageUrl;
      if (this.config.proxyUrl) {
        // Extract base proxy URL (remove /jira suffix if present)
        // Supports both local proxy (/jira-image) and Vercel (/api/jira-image)
        const proxyBase = this.config.proxyUrl.replace(/\/(api\/)?jira\/?$/, '');
        const imageEndpoint = this.config.proxyUrl.startsWith('/api/')
          ? '/api/jira-image'
          : '/jira-image';
        fetchUrl = `${proxyBase}${imageEndpoint}?url=${encodeURIComponent(imageUrl)}`;
      }

      const response = await fetch(fetchUrl, {
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'image/*'
        }
      });

      if (!response.ok) {
        logger.warn(`Failed to fetch image: ${response.status}`);
        return null;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      logger.warn('Failed to fetch image', error);
      return null;
    }
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
