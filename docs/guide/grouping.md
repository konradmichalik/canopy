---
title: Grouping
description: Organize issues by Sprint, Assignee, Status, and more
---

# Grouping

Organize issues by different criteria for better overview and sprint planning.

## Grouping Options

| Option | Description |
|--------|-------------|
| **No Grouping** | Default hierarchical tree view |
| **Sprint** | Group by sprint (Active > Future > Closed > No Sprint) |
| **Assignee** | Group by team member with avatars |
| **Status** | Group by status (To Do > In Progress > Done) |
| **Project** | Group by Jira project |
| **Recency** | Group by last update time |

![Grouping Options](/images/screenshots/grouping-dropdown.png)

![Grouped by Status](/images/screenshots/grouping-by-status.png)

## Sprint Grouping

When grouping by Sprint, issues are organized by sprint state:

1. **Active Sprint** - Currently in progress (highlighted)
2. **Future Sprints** - Planned sprints
3. **Closed Sprints** - Completed sprints
4. **No Sprint** - Backlog items

### Sprint Features

- Progress bar showing completion percentage
- Sprint date range display
- Active sprint highlighted
- Sprint state badges (Active, Future, Closed)

## Assignee Grouping

Groups issues by assigned team member:

- User avatar displayed next to name
- "Unassigned" group for items without assignee
- Count of issues per assignee

## Status Grouping

Groups issues by status category:

1. **To Do** - Not started
2. **In Progress** - Work in progress
3. **Done** - Completed

Status colors match your Jira configuration.

## Project Grouping

Useful when your JQL query spans multiple projects:

- Groups by project key and name
- Project avatar displayed
- Count of issues per project

## Recency Grouping

Groups issues by when they were last updated:

| Bucket | Description |
|--------|-------------|
| **Last 3 Days** | Recently updated issues |
| **Last 7 Days** | Updated this week |
| **Last Month** | Updated in the last 30 days |
| **Older** | Updated more than 30 days ago |

## Group Headers

Each group header shows:

- Group name (Sprint name, Assignee name, etc.)
- Issue count
- Expand/collapse chevron
- For Sprints: progress bar and date range

## Combining with Filters

Grouping works together with filters:

1. Filters are applied first (reducing the issue set)
2. Grouping organizes the filtered results

This allows you to filter to "In Progress" issues and then group by Assignee to see workload distribution.
