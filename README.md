<p align="center">
  <img src="docs/images/canopy-logo.svg" alt="Canopy Logo" width="200" />
</p>
<p align="center">
  <strong>Your Jira companion – tree visualization, powerful filters, grouping, and real-time change tracking</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<p align="center">
  <a href="https://jira-canopy.vercel.app">Try Online</a> •
  <a href="https://konradmichalik.github.io/canopy/">Documentation</a> •
  <a href="https://konradmichalik.github.io/canopy/desktop/">macOS App</a>
</p>

---

![Canopy Demo](docs/images/screenshots/tree-view-wide.png)

Canopy visualizes Jira issues in a hierarchical tree view (Epic → Story → Task → Subtask), making it easy to understand project structure and track progress across your team.

## ✨ Features

- **Tree View** - Hierarchical display with expand/collapse, progress aggregation, vim-style keyboard navigation
- **Filtering** - Quick filters, dynamic filters, saved presets, text search
- **Grouping** - By Sprint, Release, Assignee, Status, Project, or Recency
- **Change Tracking** - Checkpoint-based change detection (Beta)
- **Theming** - Light/dark mode with 6 accent colors
- **macOS Desktop App** - Native Tauri app without CORS proxy

## 🚀 Three Ways to Use Canopy

| Option | Description | CORS Proxy |
|--------|-------------|------------|
| **[Online](https://jira-canopy.vercel.app)** | Use directly in browser | Required |
| **[macOS App](https://konradmichalik.github.io/canopy/desktop/)** | Native desktop app | Not needed |
| **Local** | Run from source | Required |

### Homebrew (recommended for macOS)

```bash
brew tap konradmichalik/tap
brew install --cask canopy
```

Updates via `brew upgrade --cask canopy`.

### Manual Download

Download the latest `.dmg` from [GitHub Releases](https://github.com/konradmichalik/canopy/releases).

> The app is currently unsigned. On first launch: right-click the app and select "Open", or run `xattr -cr /Applications/Canopy.app`.

### From Source

```bash
git clone https://github.com/konradmichalik/canopy.git
cd canopy
npm install
npm run dev
```

> **Note:** A [CORS proxy](https://konradmichalik.github.io/canopy/getting-started/installation#cors-proxy) is required for browser access.

## 📋 Requirements

- Node.js 18+
- Jira Cloud or Server/Data Center instance
- API Token (Cloud) or Personal Access Token (Server)

## 📖 Documentation

Full documentation available at **[konradmichalik.github.io/canopy](https://konradmichalik.github.io/canopy/)**

## 🛠️ Tech Stack

- **[Svelte 5](https://svelte.dev/)** with TypeScript and Runes
- **[Tailwind CSS v4](https://tailwindcss.com/)** for styling
- **[shadcn-svelte](https://www.shadcn-svelte.com/)** UI components
- **[Tauri](https://tauri.app/)** for macOS desktop app

## 📄 License

MIT
