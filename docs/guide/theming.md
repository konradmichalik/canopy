---
title: Theming
description: Light/dark mode and accent color customization
---

# Theming

Customize Canopy's appearance to match your preferences.

## Color Mode

| Mode | Description |
|------|-------------|
| **Light** | Light background, dark text |
| **Dark** | Dark background, light text |
| **System** | Follows OS preference |

Toggle via the theme button in the header or in **Settings**.

## Accent Colors

Customize the app's accent color used for:
- Active states
- Links
- Progress bars
- Selected items
- Buttons

| Color | Hex | Preview |
|-------|-----|---------|
| Blue (default) | `#1868db` | Primary actions |
| Teal | `#0891b2` | Calm, professional |
| Green | `#16a34a` | Nature, growth |
| Purple | `#9333ea` | Creative, unique |
| Orange | `#ea580c` | Energetic, warm |
| Rose | `#e11d48` | Bold, attention |

![Settings Menu](/images/screenshots/settings-menu.png)

## Atlaskit Integration

Canopy uses Atlassian Design System tokens for Jira-consistent theming:

- Status colors match Jira categories
- Priority icons use Jira styling
- Issue type icons are consistent with Jira

This ensures visual consistency when working between Canopy and Jira.

## Settings Persistence

Theme settings are persisted to localStorage:

| Setting | Storage Key |
|---------|-------------|
| Color Mode | `canopy_theme` |
| Accent Color | `canopy_color_theme` |

Settings sync across browser tabs and persist after closing.

## Display Density

Adjust spacing between elements:

| Mode | Description |
|------|-------------|
| **Comfortable** | More whitespace, larger touch targets |
| **Compact** | Reduced spacing, more content visible |

Compact mode is useful for:
- Smaller screens
- Viewing large issue trees
- Quick scanning

## Keyboard Shortcuts

No keyboard shortcuts for theming. Use the settings menu.

## Exporting Theme Settings

Theme preferences are included in the configuration export:

1. Click **Settings** > **Export Configuration**
2. The JSON file includes:
   - `theme` (light/dark/system)
   - `colorTheme` (blue/teal/green/purple/orange/rose)
   - `displayDensity` (comfortable/compact)

Import this file on another device to restore your preferences.
