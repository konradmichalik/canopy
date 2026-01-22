---
title: Quick Start
description: Get up and running with Canopy in minutes
---

# Quick Start

This guide walks you through connecting to Jira and creating your first query.

## Step 1: Connect to Jira

After starting Canopy, you'll see the connection screen.

![Connection Screen](/images/screenshots/connection-screen.png)

### For Jira Cloud

1. Set **Instance Type** to `Jira Cloud`
2. Enter your Jira URL: `https://your-domain.atlassian.net`
3. Enter your **Email** (Atlassian account email)
4. Enter your **API Token** (see [Configuration](/guide/configuration) for how to create one)
5. If using the web app, configure the CORS proxy URL

### For Jira Server/Data Center

1. Set **Instance Type** to `Jira Server`
2. Enter your Jira URL: `https://jira.your-company.com`
3. Enter your **Username**
4. Enter your **Personal Access Token** or password

Click **Connect** to test the connection.

## Step 2: Create Your First Query

After connecting, you'll see the Dashboard with an empty query list.

1. Click **Add Query**
2. Enter a **Title** (e.g., "My Sprint")
3. Enter a **JQL Query**, for example:
   ```
   project = "MYPROJECT" AND sprint in openSprints()
   ```
4. Optionally select a **Color** for the query
5. Click **Save**

## Step 3: View the Tree

Click on your saved query to load issues. The tree view displays your issues hierarchically:

![Tree View](/images/screenshots/tree-view-wide.png)

### Basic Navigation

| Action | Mouse | Keyboard |
|--------|-------|----------|
| Expand/Collapse | Click chevron | `Space` or `→`/`←` |
| Move up/down | Click issue | `↑`/`↓` or `j`/`k` |
| Open in Jira | Click issue key | `Enter` |

## Step 4: Apply Filters

Use the filter bar to narrow down results:

![Filtering](/images/screenshots/filter-dropdown.png)

- **Quick Filters**: Pre-defined filters like "Assigned to me" or "Unresolved"
- **Dynamic Filters**: Auto-generated from loaded issues (Status, Assignee, Priority)
- **Text Search**: Find issues by key or summary

## Step 5: Group Issues

Change how issues are organized using the grouping dropdown:

![Grouping](/images/screenshots/grouping-dropdown.png)

| Grouping | Description |
|----------|-------------|
| None | Default tree view |
| Sprint | Group by Sprint with progress bars |
| Assignee | Group by team member |
| Status | Group by status category |
| Project | Group by Jira project |

## Next Steps

- [Tree View](/guide/tree-view) - Learn about hierarchy and progress indicators
- [Filtering](/guide/filtering) - Master the filtering system
- [Keyboard Shortcuts](/reference/keyboard) - Navigate efficiently with the keyboard
