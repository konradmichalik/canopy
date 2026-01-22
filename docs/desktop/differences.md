---
title: Web vs Desktop
description: Differences between web and desktop versions of Canopy
---

# Web vs Desktop

Comparison of features and capabilities between the web (browser) and desktop (Tauri) versions.

## Feature Comparison

| Feature | Web (Browser) | Desktop (macOS) |
|---------|---------------|-----------------|
| **Jira Connection** | CORS proxy required | Direct connection |
| **Proxy URL Field** | Must be configured | Can be left empty |
| **Data Storage** | Browser localStorage | Local file (settings.json) |
| **HTTP Requests** | Browser Fetch API | Tauri HTTP Plugin |
| **External Links** | New browser tab | System default browser |
| **Auto-updates** | Always latest | Manual download |

## Connection Setup

### Web Version (including Online)

1. Start the CORS proxy (`cd proxy && npm start`) or use a configured proxy
2. Configure proxy URL in Canopy (`http://localhost:3001/jira`)
3. Enter Jira credentials
4. Connect

### Desktop Version

1. Enter Jira URL directly
2. Enter Jira credentials
3. Connect (no proxy needed)

## Data Storage

### Web Version

Data is stored in browser localStorage:
- Tied to the browser and domain
- Cleared if browser data is cleared
- Not portable between browsers

### Desktop Version

Data is stored in a local file:
- **macOS**: `~/Library/Application Support/com.canopy.jira-viewer/settings.json`

Benefits:
- Survives browser data clearing
- Can be backed up manually
- Portable between installations

## When to Use Each

### Use Web/Online Version When

- You don't want to install software
- You're not on macOS
- You need quick access from multiple devices
- You have a CORS proxy available

### Use Desktop Version When

- You're on macOS
- You want the simplest setup (no proxy)
- You need better performance
- You want persistent storage independent of browser
- You work offline occasionally
- You prefer native app experience

## Shared Features

Both versions have identical:
- Tree view and navigation
- Filtering and grouping
- Query management
- Change tracking
- Theming and customization
- Keyboard shortcuts
- Import/Export

## Technical Details

### Web Version Stack

- Svelte 5 SPA
- Browser Fetch API
- localStorage for persistence
- Requires CORS proxy for Jira API

### Desktop Version Stack

- Svelte 5 SPA (same frontend)
- Tauri 2.0 runtime
- `tauri-plugin-http` for requests
- `tauri-plugin-store` for persistence
- `tauri-plugin-shell` for external links

The frontend code is identical - only the platform integration layer differs.
