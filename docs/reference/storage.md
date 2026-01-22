---
title: Data Storage
description: How Canopy stores your data
---

# Data Storage

Canopy stores all configuration locally in your browser or on your filesystem (desktop app).

## Web Version (localStorage)

All data is stored in browser localStorage under the following keys:

| Key | Description |
|-----|-------------|
| `canopy_connection` | Jira URL, credentials, instance type |
| `canopy_jql_queries` | Saved JQL queries with titles and colors |
| `canopy_filters` | Active filter states per query |
| `canopy_theme` | Light/dark/system preference |
| `canopy_color_theme` | Accent color preference |
| `canopy_display_density` | Comfortable/compact view |
| `canopy_field_config` | Visible fields on issue cards |
| `canopy_sort_config` | Sort field and direction |
| `canopy_sidebar_width` | Sidebar width in pixels |
| `canopy_change_checkpoints` | Change tracking checkpoints |
| `canopy_auto_refresh` | Auto-refresh interval setting |

### Storage Limits

- localStorage limit: ~5-10 MB (browser dependent)
- Canopy typically uses < 100 KB
- Issue data is not cached (fetched fresh from Jira)

### Clearing Data

**Clear all Canopy data:**
1. Settings > Clear All Data

**Clear via browser:**
1. Open Developer Tools (F12)
2. Application > Storage > Local Storage
3. Delete keys starting with `canopy_`

## Desktop Version (File Storage)

The desktop app stores data in a JSON file:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/com.canopy.jira-viewer/settings.json` |
| Windows | `%APPDATA%\com.canopy.jira-viewer\settings.json` |
| Linux | `~/.config/com.canopy.jira-viewer/settings.json` |

### Backup

Copy the `settings.json` file to back up your configuration.

### Reset

Delete the `settings.json` file to reset to defaults.

## Security Considerations

### Credentials

::: warning
Credentials are stored in plain text in localStorage/settings.json. This is standard for browser-based applications but consider the security implications.
:::

**Mitigations:**
- Use API tokens instead of passwords
- Set token expiration dates
- Revoke tokens if device is compromised

### Export Security

When exporting configuration:
- **Included:** Queries, filters, preferences
- **Not included:** Credentials, API tokens

This allows safe sharing of query configurations with team members.

## Data Portability

### Export/Import

1. Settings > Export Configuration
2. Save JSON file
3. On new device: Settings > Import Configuration

### Manual Migration

Copy localStorage keys or settings.json between devices.

## Data Isolation

- Each browser profile has separate localStorage
- Each desktop installation has its own settings file
- Multiple Jira instances can be configured by switching connections
