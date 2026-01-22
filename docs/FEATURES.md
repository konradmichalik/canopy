# ✨ Features

Complete documentation of all Canopy features.

## Table of Contents

- [🌳 Hierarchical Tree View](#-hierarchical-tree-view)
- [📂 Grouping](#-grouping)
- [📝 Query Management](#-query-management)
- [🔍 Filtering](#-filtering)
- [🔄 Change Tracking (Beta)](#-change-tracking-beta)
- [⏰ Auto-Refresh](#-auto-refresh)
- [🎛️ Display Options](#️-display-options)
- [⌨️ Keyboard Navigation](#️-keyboard-navigation)
- [🎨 Theming](#-theming)
- [📤 Import/Export](#-importexport)

---

## 🌳 Hierarchical Tree View

Canopy displays Jira issues in a tree structure that reflects their parent-child relationships.

### Hierarchy Levels

| Level | Issue Type | Parent Detection |
|-------|------------|------------------|
| 1 | Epic | Root level |
| 2 | Story | `parent` field or Epic Link |
| 3 | Task | `parent` field or issue links |
| 4 | Subtask | `parent` field |

### Hierarchy Detection

Parent-child relationships are detected using (in order of priority):

1. **`parent` field** - Used in Jira Cloud and for all subtasks
2. **Epic Link** - Custom field for Server/Data Center (auto-discovered)
3. **Issue Links** - Links with parent-child relationship types

### Tree Controls

| Action | Description |
|--------|-------------|
| Click chevron | Expand/collapse single node |
| **Expand All** | Expand all nodes in the tree |
| **Collapse All** | Collapse all nodes |

### Progress Indicators

Issue cards can display several progress metrics:

| Indicator | Description |
|-----------|-------------|
| **Individual Progress** | Time logged vs. estimated for the issue |
| **Aggregated Time** | Sum of time progress for all children |
| **Aggregated Resolution** | Percentage of resolved child issues |

---

## 📂 Grouping

Organize issues by different criteria for better overview and sprint planning.

### Grouping Options

| Option | Description |
|--------|-------------|
| **No Grouping** | Default hierarchical tree view |
| **Sprint** | Group by sprint (Active → Future → Closed → No Sprint) |
| **Assignee** | Group by team member with avatars |
| **Status** | Group by status (To Do → In Progress → Done) |
| **Project** | Group by Jira project |
| **Recency** | Group by last update time |

### Recency Buckets

When grouping by recency, issues are organized into time-based groups:

| Bucket | Description |
|--------|-------------|
| **Last 3 Days** | Recently updated issues |
| **Last 7 Days** | Updated this week |
| **Last Month** | Updated in the last 30 days |
| **Older** | Updated more than 30 days ago |

### Sprint Grouping Features

- Progress bar showing completion percentage
- Sprint date range display
- Active sprint highlighted
- Sprint state badges (Active, Future, Closed)

---

## 📝 Query Management

Save and organize multiple JQL queries for quick access.

### Creating Queries

1. Click **Add Query** in the sidebar
2. Enter a title for the query
3. Write your JQL query
4. Optionally select a color for visual distinction
5. Save the query

### Query Features

| Feature | Description |
|---------|-------------|
| **Custom Title** | Descriptive name for the query |
| **Color Coding** | Visual identification in the sidebar |
| **Issue Count** | Cached count displayed next to query name |
| **URL Slugs** | Shareable URLs based on query title |
| **Active Query** | Currently selected query is highlighted |
| **Dynamic Page Title** | Browser tab shows current query name |

### Query Actions

- **Edit** - Modify title, JQL, or color
- **Duplicate** - Create a copy with unique title
- **Delete** - Remove with confirmation dialog
- **Reorder** - Drag to reorder in sidebar

### Query Separators

Organize your queries with visual separators:

- Add separators between query groups
- Optional titles for sections (e.g., "Sprint Queries", "Team Queries")
- Drag to reorder separators like queries
- Delete or edit separator titles anytime

---

## 🔍 Filtering

### Quick Filters

Pre-defined filters for common use cases:

| Filter | JQL Equivalent |
|--------|----------------|
| Assigned to me | `assignee = currentUser()` |
| Unassigned | `assignee is EMPTY` |
| Unresolved | `resolution is EMPTY` |
| Current Sprint | `sprint in openSprints()` |

### Dynamic Filters

Automatically generated from loaded issues:

| Filter Type | Description |
|-------------|-------------|
| **Status** | All statuses in current results (color-coded badges) |
| **Issue Type** | All issue types with Jira icons |
| **Assignee** | Team members with avatars |
| **Priority** | Priority levels with Jira icons |
| **Resolution** | Resolution types |
| **Components** | Project components |
| **Fix Versions** | Version labels |

### Recency Filters

Filter by recent activity:

| Filter | Description |
|--------|-------------|
| Recently Created | Created in the last 7 days |
| Recently Updated | Updated in the last 7 days |
| Recently Commented | Commented in the last 7 days |

### Text Search

Search issues by key or summary with partial matching:

- Type `127` to find `PROJECT-127`
- Type `login` to find issues with "login" in the summary

### Filter Logic

- Filters **within the same category** are combined with **OR**
- Filters **from different categories** are combined with **AND**

**Example:**
Selecting "In Progress" + "In Review" (status) AND "High" (priority) shows issues that are:
`(In Progress OR In Review) AND High priority`

### Saved Quick Filters

Save your current filter combination as a reusable preset:

1. Apply desired filters (Quick Filters, Dynamic Filters, Recency, Search)
2. Click **Save** → **As Quickfilter**
3. Enter a name and optionally select an icon
4. The saved filter appears as a pill above the filter bar

| Action | Description |
|--------|-------------|
| **Click** | Toggle filter on/off |
| **Drag** | Reorder saved filters via drag handle |
| **Edit** | Rename or change icon via dropdown menu |
| **Delete** | Remove with confirmation |

**Note:** Saved Quick Filters are stored per query and persist across sessions.

### Filter Persistence

Active filters are automatically saved per query and restored when switching between queries.

### Collapsible Filter Section

The filter section can be collapsed to maximize tree view space. State is persisted across sessions.

---

## 🔄 Change Tracking (Beta)

> **Note:** This feature is currently in beta and may change in future versions.

Track changes to your issues since your last checkpoint.

### How It Works

1. When you first load a query, a checkpoint is automatically created
2. On subsequent loads, changes since the checkpoint are detected
3. Visual indicators highlight new issues and status changes
4. Save a new checkpoint to acknowledge changes

### Change Types Detected

| Type | Indicator | Description |
|------|-----------|-------------|
| **New Issues** | Green highlight | Issues added since checkpoint |
| **Removed Issues** | Listed in summary | Issues no longer matching query |
| **Status Changes** | Blue highlight | Issues with changed status |

### Activity Period

Filter recent activity by time window:

| Period | Description |
|--------|-------------|
| **24 hours** | Show activity from last day |
| **7 days** | Show activity from last week |
| **Off** | Disable activity indicators |

### Change Summary

- View summary of all changes at a glance
- Click issue keys to open in Jira
- Pending changes indicator on query list

---

## ⏰ Auto-Refresh

Keep your data up to date automatically.

### Refresh Intervals

| Interval | Description |
|----------|-------------|
| **Off** | Manual refresh only |
| **5 minutes** | Frequent updates |
| **30 minutes** | Balanced updates |
| **1 hour** | Less frequent updates |

### What Gets Refreshed

- Current query issues
- Issue counts for all queries in sidebar
- Change tracking comparisons

### Configuration

Enable auto-refresh from Settings. The interval is persisted across sessions.

---

## 🎛️ Display Options

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

Choose how dates are displayed:

| Format | Example |
|--------|---------|
| **Absolute** | Jan 8, 2026 |
| **Relative** | 2 days ago |

Toggle between formats in Settings. Applies to all date fields (Created, Updated, Due Date).

### Resizable Sidebar

Drag the sidebar edge to resize. Width is persisted across sessions.

---

## ⌨️ Keyboard Navigation

Navigate the tree using keyboard shortcuts:

### Movement

| Key | Vim | Action |
|-----|-----|--------|
| `Arrow Down` | `j` | Move to next issue |
| `Arrow Up` | `k` | Move to previous issue |
| `Arrow Right` | `l` | Expand node or move to first child |
| `Arrow Left` | `h` | Collapse node or move to parent |
| `Home` | - | Move to first issue |
| `End` | - | Move to last issue |

### Actions

| Key | Action |
|-----|--------|
| `Enter` | Open issue in Jira (new tab) |
| `Space` | Toggle expand/collapse |
| `Escape` | Clear focus |

---

## 🎨 Theming

### Color Mode

| Mode | Description |
|------|-------------|
| **Light** | Light background, dark text |
| **Dark** | Dark background, light text |
| **System** | Follows OS preference |

### Accent Colors

Customize the app's accent color:

| Color | Hex |
|-------|-----|
| Blue (default) | `#1868db` |
| Teal | `#0891b2` |
| Green | `#16a34a` |
| Purple | `#9333ea` |
| Orange | `#ea580c` |
| Rose | `#e11d48` |

---

## 📤 Import/Export

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

---

## 🐛 Developer Tools

### Debug Mode

Enable detailed logging in the browser console:

1. Click **Settings** icon
2. Toggle **Debug Mode**

Debug logs include:
- API requests and responses
- State changes
- Filter operations
- Performance metrics

---

## ❓ Help Modal

First-time users are shown an introductory slideshow explaining key features. Access it anytime via **Settings > Show Help**.
