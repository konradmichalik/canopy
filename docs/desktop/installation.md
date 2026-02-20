---
title: macOS Installation
description: Install the Canopy desktop app on macOS
---

# macOS Installation

## Homebrew (recommended)

```bash
brew tap konradmichalik/tap
brew install --cask canopy
```

Update with `brew upgrade --cask canopy`.

::: tip
Homebrew automatically removes the macOS quarantine attribute — no extra steps needed.
:::

## Manual Download

1. [Download the latest release from GitHub](https://github.com/konradmichalik/canopy/releases/latest)
   - **Apple Silicon** (M1/M2/M3): `Canopy_x.x.x_aarch64.dmg`
   - **Intel** (x64): `Canopy_x.x.x_x64.dmg`
2. Open the DMG file
3. Drag `Canopy.app` to your Applications folder
4. Remove the quarantine attribute so macOS allows the unsigned app:
   ```bash
   xattr -cr /Applications/Canopy.app
   ```

## Gatekeeper Notice

::: warning Unsigned App
Since Canopy is not signed with an Apple Developer ID certificate, macOS Gatekeeper blocks the app. When installing via Homebrew, this is handled automatically. For manual installs, you must remove the quarantine attribute with the command above.
:::

Without removing the quarantine attribute, you might see one of these messages:
- *"Canopy" is damaged and can't be opened. You should move it to the Trash.*
- *"Canopy" can't be opened because Apple cannot check it for malicious software.*

## First Launch

After installation:

1. Launch Canopy
2. Enter your Jira URL
3. Enter your credentials (Email + API Token for Cloud, Username + PAT for Server)
4. **No CORS proxy required** - leave the proxy field empty
5. Click Connect

## Updating

If installed via Homebrew:

```bash
brew upgrade --cask canopy
```

If installed manually: download the new version and replace the existing app in Applications.

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
