---
title: Introduction
description: Learn what Canopy is and how it helps visualize Jira issues
---

# Introduction

Canopy is a hierarchical Jira issue viewer that displays tickets in a tree structure, making it easy to understand project structure and track progress across your team.

## Why "Canopy"?

In forestry, the *canopy* is the uppermost layer of a forest, formed by the crowns of trees. Just as a forest canopy provides an overview of the trees below, Canopy gives you a bird's-eye view of your Jira project hierarchy - from Epics down to Subtasks.

## What is Canopy?

Canopy transforms flat Jira query results into an interactive tree view that reflects parent-child relationships:

```
Epic
├── Story
│   ├── Task
│   │   └── Subtask
│   └── Task
└── Story
    └── Task
```

This hierarchical view helps you:

- **Understand scope** - See how work breaks down from Epic to Subtask
- **Track progress** - View aggregated completion status across child issues
- **Filter effectively** - Find specific issues using dynamic filters generated from your data
- **Stay organized** - Group issues by Sprint, Assignee, Status, or Project

## How to Use Canopy

Choose the option that works best for you:

| Option | Description | CORS Proxy |
|--------|-------------|------------|
| **[Online Version](https://jira-canopy.vercel.app)** | Use directly in your browser | Required |
| **[macOS Desktop App](/desktop/)** | Native Mac app | Not needed |
| **[Local Setup](/getting-started/installation)** | Run from source code | Required |

::: tip Recommendation
The **Desktop App** provides the simplest setup - no CORS proxy configuration needed. Just download, install, and connect.
:::

## Key Features

| Feature | Description |
|---------|-------------|
| **Tree View** | Expand/collapse hierarchy with vim-style keyboard navigation |
| **Filtering** | Quick filters, dynamic filters, saved presets, text search |
| **Grouping** | By Sprint, Assignee, Status, Project, or Recency |
| **Change Tracking** | Checkpoint-based detection of new issues and status changes |
| **Theming** | Light/dark mode with 6 customizable accent colors |
| **Desktop App** | Native Tauri app without CORS proxy requirements |

## Supported Jira Platforms

| Platform | Authentication |
|----------|----------------|
| Jira Cloud | Email + API Token |
| Jira Server | Username + Personal Access Token |
| Jira Data Center | Username + Personal Access Token |

## Next Steps

- **Try it now:** [jira-canopy.vercel.app](https://jira-canopy.vercel.app)
- **Desktop App:** [Installation Guide](/desktop/installation)
- **Local Setup:** [Installation](/getting-started/installation)
- **First Query:** [Quick Start](/getting-started/quick-start)
