---
title: Features Overview
description: Complete overview of all Canopy features
---

# Features Overview

Canopy provides a comprehensive set of features for visualizing and managing Jira issues.

## Core Features

| Feature | Description |
|---------|-------------|
| [Tree View](/guide/tree-view) | Hierarchical display with expand/collapse and progress indicators |
| [Filtering](/guide/filtering) | Quick filters, dynamic filters, saved presets, and text search |
| [Grouping](/guide/grouping) | Organize by Sprint, Assignee, Status, Project, or Recency |
| [Query Management](/guide/queries) | Save and organize multiple JQL queries with colors |
| [Change Tracking](/guide/change-tracking) | Checkpoint-based change detection (Beta) |
| [Theming](/guide/theming) | Light/dark mode with customizable accent colors |
| [Configuration](/guide/configuration) | Jira connection and credential management |

## Display Options

### Sorting

Issues are sorted by hierarchy level first, then by your selected field:

| Sort Field | Description |
|------------|-------------|
| Key | Issue key (PROJECT-123) |
| Priority | Jira priority level |
| Created | Creation date |
| Updated | Last update date |
| Status | Status category |

Toggle ascending/descending with the sort direction button.

### Display Density

| Mode | Description |
|------|-------------|
| **Comfortable** | More spacing, larger cards |
| **Compact** | Reduced spacing, more issues visible |

### Configurable Fields

Choose which fields to display on issue cards:

| Field | Description |
|-------|-------------|
| Progress | Individual time tracking progress |
| Aggregated Time | Sum of children's time progress |
| Aggregated Resolution | Percentage of resolved children |
| Status | Current status with color |
| Assignee | Assigned user with avatar |
| Priority | Priority icon |
| Created | Creation date |
| Updated | Last update date |
| Due Date | Due date with overdue highlighting |
| Comments | Comment count |
| Components | Project components |
| Labels | Issue labels |
| Resolution | Resolution type |
| Fix Versions | Target versions |

### Date Format

| Format | Example |
|--------|---------|
| **Absolute** | Jan 8, 2026 |
| **Relative** | 2 days ago |

Toggle between formats in Settings.

## Auto-Refresh

Keep your data up to date automatically.

| Interval | Description |
|----------|-------------|
| **Off** | Manual refresh only |
| **5 minutes** | Frequent updates |
| **30 minutes** | Balanced updates |
| **1 hour** | Less frequent updates |

Auto-refresh updates:
- Current query issues
- Issue counts for all queries in sidebar
- Change tracking comparisons

## Import/Export

### Export Configuration

Export your complete setup as a JSON file:

**Included:**
- Saved JQL queries
- Filter states per query
- Display preferences
- Theme settings
- Field configurations

**Not included (for security):**
- Jira credentials
- API tokens

### Import Configuration

Restore settings from a previously exported JSON file. Useful for:
- Backup and restore
- Sharing queries with team members
- Syncing between devices

## Debug Mode

Enable detailed logging in the browser console:

1. Click **Settings** icon
2. Toggle **Debug Mode**

Debug logs include:
- API requests and responses
- State changes
- Filter operations
- Performance metrics
