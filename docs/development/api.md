---
title: API Layer
description: Jira client architecture and API handling
---

# API Layer

The API layer handles communication with Jira Cloud and Server instances.

## Client Architecture

```
JiraClient (abstract)
├── JiraCloudClient
└── JiraServerClient
```

### Abstract Base Class

```typescript
// JiraClient.ts
export abstract class JiraClient {
  protected baseUrl: string;
  protected credentials: Credentials;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.credentials = config.credentials;
  }

  abstract searchIssues(jql: string): Promise<JiraIssue[]>;
  abstract getFields(): Promise<JiraField[]>;
  abstract getCurrentUser(): Promise<JiraUser>;

  protected abstract getAuthHeader(): string;
}
```

### Factory Function

```typescript
// factory.ts
import { JiraCloudClient } from './JiraCloudClient';
import { JiraServerClient } from './JiraServerClient';

export function createJiraClient(config: ClientConfig): JiraClient {
  if (config.instanceType === 'cloud') {
    return new JiraCloudClient(config);
  }
  return new JiraServerClient(config);
}
```

## API Differences

| Feature | Cloud | Server |
|---------|-------|--------|
| Base URL | `atlassian.net` | Custom domain |
| Auth | Email + API Token | Username + PAT |
| Search endpoint | `/rest/api/3/search/jql` | `/rest/api/2/search` |
| Pagination | `nextPageToken` | `startAt` / `maxResults` |
| Epic Link | `parent` field | Custom field |

## Cloud Client

```typescript
// JiraCloudClient.ts
export class JiraCloudClient extends JiraClient {

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let nextPageToken: string | null = null;

    do {
      const response = await this.fetch('/rest/api/3/search/jql', {
        method: 'POST',
        body: JSON.stringify({
          jql,
          fields: ISSUE_FIELDS,
          nextPageToken
        })
      });

      allIssues.push(...response.issues);
      nextPageToken = response.nextPageToken;
    } while (nextPageToken);

    return allIssues;
  }

  protected getAuthHeader(): string {
    const { email, apiToken } = this.credentials;
    return `Basic ${btoa(`${email}:${apiToken}`)}`;
  }
}
```

## Server Client

```typescript
// JiraServerClient.ts
export class JiraServerClient extends JiraClient {
  private epicLinkFieldId: string | null = null;

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100;

    do {
      const response = await this.fetch('/rest/api/2/search', {
        method: 'POST',
        body: JSON.stringify({
          jql,
          fields: ISSUE_FIELDS,
          startAt,
          maxResults
        })
      });

      allIssues.push(...response.issues);
      startAt += maxResults;
    } while (startAt < response.total);

    return allIssues;
  }

  async discoverEpicLinkField(): Promise<string | null> {
    const fields = await this.getFields();
    const epicLinkField = fields.find(f =>
      f.name === 'Epic Link' || f.key === 'epicLink'
    );
    this.epicLinkFieldId = epicLinkField?.id ?? null;
    return this.epicLinkFieldId;
  }
}
```

## Issue Fields

Fields requested from Jira:

```typescript
const ISSUE_FIELDS = [
  'summary',
  'status',
  'issuetype',
  'priority',
  'assignee',
  'reporter',
  'created',
  'updated',
  'duedate',
  'resolution',
  'parent',
  'issuelinks',
  'timetracking',
  'components',
  'labels',
  'fixVersions',
  'comment',
  'sprint'
];
```

## Error Handling

```typescript
async fetch(endpoint: string, options: RequestInit): Promise<any> {
  const response = await fetch(`${this.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Check your credentials.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. Check your permissions.');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

## CORS Handling

### Web Version

Requests go through CORS proxy:

```typescript
const proxyUrl = connectionState.proxyUrl;
const targetUrl = `${proxyUrl}${endpoint}`;
```

### Desktop Version

Tauri's HTTP plugin bypasses CORS:

```typescript
import { fetch } from '@tauri-apps/plugin-http';

// Direct request to Jira
const response = await fetch(url, options);
```
