---
title: Contributing
description: How to contribute to Canopy
---

# Contributing

Guidelines for contributing to Canopy.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/konradmichalik/canopy.git
cd canopy

# Install dependencies
npm install

# Start development server
npm run dev
```

## Code Quality

### Type Checking

```bash
npm run check
```

Runs `svelte-check` and TypeScript compiler.

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

ESLint with Svelte and TypeScript plugins.

### Formatting

```bash
# Check formatting
npm run format:check

# Auto-format
npm run format
```

Prettier with Svelte plugin.

### Pre-commit Checklist

Before committing:

```bash
npm run check && npm run lint && npm run format:check
```

## Adding Features

### New Store

1. Create `src/lib/stores/myFeature.svelte.ts`
2. Define state with `$state({})`
3. Add storage key to `src/lib/utils/storage.ts`
4. Export initialization function
5. Call initializer in `App.svelte`

### New Component

1. Create in appropriate folder under `src/lib/components/`
2. Use TypeScript with proper prop types
3. Follow existing component patterns
4. Use Tailwind CSS for styling

### New Filter Type

1. Add filter type to `src/lib/types/index.ts`
2. Update `buildDynamicFilters()` in `filters.svelte.ts`
3. Add UI component in `src/lib/components/filters/`

### New API Field

1. Add type to `src/lib/types/jira.ts`
2. Add field to `ISSUE_FIELDS` array
3. Update `fieldConfig` store if user-configurable

## Commit Guidelines

Use conventional commits:

```
feat: add new feature
fix: fix a bug
refactor: code refactoring
docs: documentation changes
test: test additions/changes
chore: maintenance tasks
```

Examples:
```
feat: add sprint grouping option
fix: resolve keyboard navigation in collapsed nodes
refactor: extract filter logic to utility function
docs: update installation guide for Linux
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run all quality checks
5. Submit a pull request

PR checklist:
- [ ] Code passes `npm run check`
- [ ] Code passes `npm run lint`
- [ ] Code is formatted with Prettier
- [ ] Changes are documented if needed
- [ ] Commit messages follow conventions

## Project Guidelines

### File Size

- Components: < 200 lines preferred
- Stores: < 100 lines preferred
- Extract utilities when files grow large

### Naming Conventions

- Components: `PascalCase.svelte`
- Stores: `camelCase.svelte.ts`
- Utils: `kebab-case.ts`
- Types: `PascalCase` for interfaces/types

### Styling

- Use Tailwind CSS utilities
- Use Atlaskit tokens for Jira consistency
- Follow existing patterns in codebase

### State Management

- Use Svelte 5 `$state` runes
- Persist to localStorage via `storage.ts`
- Keep stores focused and small

## Getting Help

- Check existing issues on GitHub
- Open a new issue for bugs or features
- Join discussions for questions
