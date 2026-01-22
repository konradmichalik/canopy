---
layout: home

hero:
  name: Canopy
  text: Hierarchical Jira Viewer
  tagline: Visualize your Jira tickets in a tree structure with powerful filtering and grouping
  image:
    light: /logo-hero.svg
    dark: /logo-hero-dark.svg
    alt: Canopy Logo
  actions:
    - theme: brand
      text: Try Online
      link: https://jira-canopy.vercel.app
    - theme: alt
      text: Get Started
      link: /getting-started/

features:
  - icon: 🌳
    title: Tree View
    details: Hierarchical display (Epic, Story, Task, Subtask) with expand/collapse, progress aggregation, and vim-style keyboard navigation.
    link: /guide/tree-view
  - icon: 🔍
    title: Powerful Filtering
    details: Quick filters, dynamic filters from loaded issues, saved filter presets, text search, and recency filters.
    link: /guide/filtering
  - icon: 📂
    title: Flexible Grouping
    details: Group by Sprint, Assignee, Status, Project, or Recency for better overview and sprint planning.
    link: /guide/grouping
  - icon: 🔄
    title: Change Tracking
    details: Checkpoint-based change detection with visual indicators for new issues and status changes.
    link: /guide/change-tracking
  - icon: 🖥️
    title: macOS Desktop App
    details: Native Tauri application for macOS without CORS proxy requirements.
    link: /desktop/
  - icon: 🎨
    title: Customizable
    details: Light/dark mode, 6 accent colors, configurable fields, and comfortable/compact display density.
    link: /guide/theming
---

<div class="app-preview">
  <img src="/images/screenshots/tree-view-wide.png" alt="Canopy Tree View - Hierarchical Jira Issue Display" />
</div>

<style>
.app-preview {
  margin: 2rem auto 3rem;
  max-width: 1152px;
  padding: 0 24px;
}
.app-preview img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--vp-c-border);
}
</style>

## Three Ways to Use Canopy

| Option | Description | Best For |
|--------|-------------|----------|
| **[Online Version](https://jira-canopy.vercel.app)** | Use directly in browser, no installation | Quick access, trying it out |
| **[macOS Desktop App](https://github.com/konradmichalik/canopy/releases/latest)** | Native Mac app | Daily use, no proxy needed |
| **[Local Setup](/getting-started/installation)** | Run from source code | Development, customization |

::: tip Recommended
For the best experience on Mac, use the **Desktop App** - it connects directly to Jira without needing a CORS proxy.
:::

## Quick Start

### Option 1: Try Online

Visit [jira-canopy.vercel.app](https://jira-canopy.vercel.app) and connect to your Jira instance.

::: warning CORS Proxy Required
The online version requires a CORS proxy for Jira API access. See the [Installation Guide](/getting-started/installation#cors-proxy).
:::

### Option 2: macOS Desktop App

Download the desktop app for Mac - no proxy required:
- [Download Latest Release](https://github.com/konradmichalik/canopy/releases/latest)
- [macOS Installation Guide](/desktop/installation)

### Option 3: Run Locally

```bash
git clone https://github.com/konradmichalik/canopy.git
cd canopy
npm install
npm run dev
```

## Supported Platforms

| Platform | Authentication |
|----------|----------------|
| Jira Cloud | Email + API Token |
| Jira Server/Data Center | Username + Personal Access Token |

## Tech Stack

- [Svelte 5](https://svelte.dev/) with TypeScript and Runes
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) UI components
- [Tauri](https://tauri.app/) for desktop builds
