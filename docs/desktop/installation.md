---
title: macOS Installation
description: Install the Canopy desktop app on macOS
---

# macOS Installation

## Download and Install

1. [Download the latest release from GitHub](https://github.com/konradmichalik/canopy/releases/latest)
   - **Apple Silicon** (M1/M2/M3): `Canopy_x.x.x_aarch64.dmg`
   - **Intel** (x64): `Canopy_x.x.x_x64.dmg`
2. Open the DMG file
3. Drag `Canopy.app` to your Applications folder

## Gatekeeper Notice

::: warning Unsigned App
Since Canopy is not signed with an Apple Developer ID certificate, macOS Gatekeeper may block the app.
:::

You might see one of these messages:
- *"Canopy" is damaged and can't be opened. You should move it to the Trash.*
- *"Canopy" can't be opened because Apple cannot check it for malicious software.*

**Solutions:**

1. **Remove quarantine attribute** (recommended):
   ```bash
   xattr -cr /Applications/Canopy.app
   ```

2. **Right-click to Open**:
   - Right-click on `Canopy.app` in Finder
   - Select "Open"
   - Click "Open" in the dialog

3. **System Settings**:
   - Go to **System Settings > Privacy & Security**
   - Scroll down to find the blocked app message
   - Click "Open Anyway"

## First Launch

After installation:

1. Launch Canopy
2. Enter your Jira URL
3. Enter your credentials (Email + API Token for Cloud, Username + PAT for Server)
4. **No CORS proxy required** - leave the proxy field empty
5. Click Connect

## Updating

To update Canopy:

1. Download the new version
2. Replace the existing app in Applications

Your settings and queries are preserved during updates.

## Data Location

Canopy stores data in:

```
~/Library/Application Support/com.canopy.jira-viewer/settings.json
```

## Uninstalling

1. Move `Canopy.app` from Applications to Trash
2. Optionally delete settings:
   ```bash
   rm -rf ~/Library/Application\ Support/com.canopy.jira-viewer
   ```
