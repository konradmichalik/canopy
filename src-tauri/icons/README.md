# App Icons

This directory should contain the application icons for Tauri builds.

## Required Files

For macOS:
- `icon.icns` - macOS app icon bundle
- `128x128.png` - 128x128 PNG
- `128x128@2x.png` - 256x256 PNG (Retina)
- `32x32.png` - 32x32 PNG

For Windows:
- `icon.ico` - Windows icon file

## Generating Icons

You can generate all required icons from a single 1024x1024 PNG source:

```bash
# Install tauri-cli if not already installed
cargo install tauri-cli

# Generate icons from a source image
cargo tauri icon path/to/icon-1024x1024.png
```

Alternatively, use online tools like:
- https://makeappicon.com/
- https://www.appicon.co/

## Temporary Workaround

If you don't have icons yet, you can create placeholder icons using ImageMagick:

```bash
# Create a simple colored square as placeholder
convert -size 1024x1024 xc:#4A90A4 icon.png
cargo tauri icon icon.png
```

Or download and use the Tauri default icons from:
https://github.com/tauri-apps/tauri/tree/dev/examples/api/src-tauri/icons
