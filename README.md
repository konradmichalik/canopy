<p align="center">
  <img src="docs/images/canopy-logo.svg" alt="Canopy Logo" width="200" />
</p>

<h1 align="center">Canopy</h1>

<p align="center">
  <strong>A hierarchical Jira issue viewer that displays tickets in a tree structure</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="docs/INSTALLATION.md">Installation</a> •
  <a href="docs/CONFIGURATION.md">Configuration</a> •
  <a href="docs/FEATURES.md">Documentation</a> •
  <a href="docs/DEVELOPMENT.md">Development</a>
</p>

---

![Canopy Demo](docs/images/jira-hierarchy-tree-demo.jpg)

## 🌳 Overview

Canopy visualizes Jira issues in a hierarchical tree view (Epic → Story → Task → Subtask), making it easy to understand project structure and track progress across your team.

## ✨ Features

| Category | Highlights |
|----------|------------|
| **Tree View** | Hierarchical display with expand/collapse, keyboard navigation (vim-style), and progress aggregation |
| **Filtering** | Quick filters, dynamic filters (status, assignee, priority), text search, and recency filters |
| **Theming** | Light/dark mode, system theme detection, and 6 customizable accent colors |
| **Data Management** | Multiple saved JQL queries, import/export configuration, local storage persistence |
| **Jira Support** | Both Jira Cloud and Server/Data Center instances |

> **[View all features →](docs/FEATURES.md)**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

> **Note:** A CORS proxy is required for local development. See [Installation Guide](docs/INSTALLATION.md#cors-proxy) for details.

## 📋 Requirements

- Node.js 18+
- Jira Cloud or Server/Data Center instance
- API Token (Cloud) or Personal Access Token (Server)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Installation](docs/INSTALLATION.md) | Setup guide, CORS proxy configuration |
| [Configuration](docs/CONFIGURATION.md) | Jira authentication, connection settings |
| [Features](docs/FEATURES.md) | Complete feature documentation |
| [Development](docs/DEVELOPMENT.md) | Architecture, project structure, contributing |

## 🛠️ Tech Stack

- **[Svelte 5](https://svelte.dev/)** with TypeScript and Runes
- **[Tailwind CSS v4](https://tailwindcss.com/)** for styling
- **[shadcn-svelte](https://www.shadcn-svelte.com/)** UI components
- **[Atlaskit Tokens](https://atlassian.design/components/tokens/)** for Jira-consistent theming
- **[Vite](https://vite.dev/)** as build tool

## 📄 License

MIT
