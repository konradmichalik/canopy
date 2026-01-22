---
title: Building the Desktop App
description: Build Canopy from source using Tauri
---

# Building the Desktop App

Build Canopy from source for development or custom distribution.

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal or run:
```bash
source $HOME/.cargo/env
```

Verify the installation:
```bash
rustc --version
```

### 2. Platform-Specific Dependencies

#### macOS
```bash
xcode-select --install
```

#### Windows
- Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Select "Desktop development with C++" during installation

#### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### 3. Node.js Dependencies

```bash
npm install
```

## Development

### Start Dev Server

```bash
npm run tauri dev
```

This starts:
1. Vite dev server (frontend with hot-reload)
2. Tauri app (native window)

Frontend changes apply automatically. Rust code changes trigger recompilation.

### Frontend-Only Development

For pure frontend development without Tauri:
```bash
npm run dev
```

## Production Build

### Create Build

```bash
npm run tauri build
```

The build process:
1. Compiles the frontend (`npm run build`)
2. Compiles the Rust backend code
3. Creates platform-specific installers

### Build Output

Files are located in `src-tauri/target/release/bundle/`:

| Platform | File Type | Path |
|----------|-----------|------|
| macOS | DMG Installer | `dmg/Canopy_0.1.0_aarch64.dmg` |
| macOS | App Bundle | `macos/Canopy.app` |
| Windows | MSI Installer | `msi/Canopy_0.1.0_x64.msi` |
| Windows | NSIS Installer | `nsis/Canopy_0.1.0_x64-setup.exe` |
| Linux | Debian Package | `deb/canopy_0.1.0_amd64.deb` |
| Linux | AppImage | `appimage/canopy_0.1.0_amd64.AppImage` |

### Debug Build

For faster builds without optimizations:
```bash
npm run tauri build -- --debug
```

### Specific Target

Build for a specific platform:
```bash
npm run tauri build -- --target aarch64-apple-darwin
```

## Code Signing

### macOS

Requirements:
- Apple Developer Account ($99/year)
- Developer ID Application Certificate

In `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (XXXXXXXXXX)"
    }
  }
}
```

For notarization (recommended for macOS 10.15+):
```bash
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

npm run tauri build
```

### Windows

Requirements:
- Code Signing Certificate (e.g., from DigiCert, Sectigo)

In `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

## Configuration

### App Metadata

In `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Canopy",
  "version": "0.1.0",
  "identifier": "com.canopy.jira-viewer"
}
```

### Window Size

```json
{
  "app": {
    "windows": [{
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600
    }]
  }
}
```

### Icons

Icons are in `src-tauri/icons/`. Generate all sizes from a 1024x1024 PNG:
```bash
npm run tauri icon src-tauri/icons/icon.png
```

## Troubleshooting

### "error: linker `cc` not found"

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential
```

### "webkit2gtk not found"

**Linux:**
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

### Slow Build Times

```bash
# Debug build (faster)
npm run tauri build -- --debug

# Clear caches
rm -rf src-tauri/target
rm -rf node_modules && npm install
```
