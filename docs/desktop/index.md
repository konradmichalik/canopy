---
title: macOS Desktop App
description: Native Tauri desktop application for Canopy
---

# macOS Desktop App

Canopy is available as a native macOS desktop application built with [Tauri](https://tauri.app/). The desktop version provides direct access to Jira without requiring a CORS proxy.

<div style="margin: 1.5rem 0;">
  <a href="https://github.com/konradmichalik/canopy/releases/latest" target="_blank" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--vp-c-brand-1); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
    Download Latest Release
  </a>
</div>

<!-- TODO: Add screenshot of desktop app -->
![Desktop App Placeholder](/images/jira-hierarchy-tree-demo.jpg)

## Why Use the Desktop App?

| Benefit | Description |
|---------|-------------|
| **No CORS Proxy** | Connect directly to Jira without proxy setup |
| **Native Performance** | Faster than browser-based version |
| **System Integration** | Uses system browser for external links |
| **Persistent Storage** | Data stored in local file system |

## Supported Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | Apple Silicon (M1/M2/M3) | Available |
| macOS | Intel (x64) | Available |
| Windows | x64 | Planned |
| Linux | x64 | Planned |

::: info Currently macOS Only
The desktop app is currently available for macOS only. Windows and Linux versions are planned for future releases.
:::

## Quick Install (macOS)

1. [Download the latest release](https://github.com/konradmichalik/canopy/releases/latest)
   - **Apple Silicon** (M1/M2/M3): `Canopy_x.x.x_aarch64.dmg`
   - **Intel**: `Canopy_x.x.x_x64.dmg`
2. Open the DMG file
3. Drag `Canopy.app` to Applications
4. See [Gatekeeper Notice](/desktop/installation#gatekeeper-notice) if blocked

## Technical Details

The desktop app uses Tauri plugins for native functionality:

| Plugin | Purpose |
|--------|---------|
| **tauri-plugin-http** | HTTP requests without CORS restrictions |
| **tauri-plugin-store** | Persistent data storage |
| **tauri-plugin-shell** | Opening external links in browser |

## Next Steps

- [Installation](/desktop/installation) - Detailed installation instructions
- [Building](/desktop/building) - Build from source
- [Web vs Desktop](/desktop/differences) - Feature comparison
