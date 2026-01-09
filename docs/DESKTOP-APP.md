# Canopy Desktop App (Tauri)

Canopy is available as a native desktop application built with [Tauri](https://tauri.app/). The desktop version provides direct access to Jira without requiring a CORS proxy.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development](#development)
- [Production Build](#production-build)
- [Distribution](#distribution)
- [Differences from Web Version](#differences-from-web-version)
- [Troubleshooting](#troubleshooting)

---

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

---

## Development

### Start Dev Server

```bash
npm run tauri dev
```

This starts:
1. Vite dev server (frontend with hot-reload)
2. Tauri app (native window)

Frontend changes are applied automatically. Rust code changes trigger automatic recompilation.

### Frontend-Only Development

For pure frontend development without Tauri:
```bash
npm run dev
```

---

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

The finished files are located in:
```
src-tauri/target/release/bundle/
```

| Platform | File Type | Path |
|----------|-----------|------|
| macOS | DMG Installer | `dmg/Canopy_0.1.0_aarch64.dmg` |
| macOS | App Bundle | `macos/Canopy.app` |
| Windows | MSI Installer | `msi/Canopy_0.1.0_x64.msi` |
| Windows | NSIS Installer | `nsis/Canopy_0.1.0_x64-setup.exe` |
| Linux | Debian Package | `deb/canopy_0.1.0_amd64.deb` |
| Linux | AppImage | `appimage/canopy_0.1.0_amd64.AppImage` |

### Debug Build

For a faster build without optimizations:
```bash
npm run tauri build -- --debug
```

---

## Distribution

### macOS

#### Without Code Signing (for testing/internal use)

1. Share the DMG file (Google Drive, Dropbox, etc.)
2. Recipients must on first launch:
   - Right-click on `Canopy.app`
   - Select "Open"
   - Confirm "Open" in the dialog

#### With Code Signing (for public distribution)

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
# Set Apple ID and app-specific password as environment variables
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

npm run tauri build
```

### Windows

#### Without Code Signing

MSI/NSIS installers can be distributed directly. Windows SmartScreen will show a warning on first launch.

#### With Code Signing

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

### Linux

#### Debian/Ubuntu
```bash
sudo dpkg -i canopy_0.1.0_amd64.deb
```

#### AppImage
```bash
chmod +x canopy_0.1.0_amd64.AppImage
./canopy_0.1.0_amd64.AppImage
```

---

## Differences from Web Version

| Feature | Web (Browser) | Desktop (Tauri) |
|---------|---------------|-----------------|
| **Jira Connection** | CORS proxy required | Direct connection |
| **Proxy URL Field** | Must be filled in | Can be left empty |
| **Data Storage** | localStorage | Local file (`settings.json`) |
| **HTTP Requests** | Browser Fetch API | Tauri HTTP Plugin |
| **External Links** | New browser tab | System default browser |

### Technical Details

The desktop app uses the following Tauri plugins:

- **tauri-plugin-http**: HTTP requests without CORS restrictions
- **tauri-plugin-store**: Persistent data storage
- **tauri-plugin-shell**: Opening external links in browser

---

## Troubleshooting

### Build fails: "error: linker `cc` not found"

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential
```

### Build fails: "webkit2gtk not found"

**Linux:**
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

### App won't start on macOS: "App is damaged"

For unsigned apps downloaded from the internet:
```bash
xattr -cr /Applications/Canopy.app
```

### CORS errors in desktop app

If CORS errors occur despite using Tauri:

1. Verify the app is actually running in Tauri (not in browser)
2. Check `src-tauri/capabilities/default.json` - HTTP permissions must be configured
3. Restart the app

### Slow build times

For faster builds during development:
```bash
# Debug build (no optimizations)
npm run tauri build -- --debug

# Specific target only
npm run tauri build -- --target aarch64-apple-darwin
```

### Clear build cache

```bash
# Rust cache
rm -rf src-tauri/target

# Node cache
rm -rf node_modules
npm install
```

---

## Configuration

### Change App Metadata

In `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Canopy",
  "version": "0.1.0",
  "identifier": "com.canopy.jira-viewer"
}
```

### Change Icons

Icons are located in `src-tauri/icons/`. Required formats:

- `icon.png` (1024x1024) - Base icon
- `icon.icns` - macOS
- `32x32.png`, `128x128.png`, `128x128@2x.png` - Various sizes

Icon generator:
```bash
npm run tauri icon src-tauri/icons/icon.png
```

### Change Window Size

In `src-tauri/tauri.conf.json`:

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
