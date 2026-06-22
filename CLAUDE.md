# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Transloco is an internationalization (i18n) library for Angular, published under the `@jsverse` npm scope. It's an Nx monorepo with 14 libraries and a playground app.

## Common Commands

```bash
# Development
npm start                          # Serve playground app
npm run commit                     # Interactive conventional commit (git-cz)

# Build
npm run ci:build                   # Build all packages
nx build <package-name>            # Build single package

# Test
npm run ci:test                    # Test all packages
nx test <package-name>             # Test single package
nx test-library transloco          # Core library tests (Karma)
nx test-schematics transloco       # Core schematics tests (Jest)

# Lint
npm run ci:lint                    # Lint all packages
nx lint <package-name>             # Lint single package

# E2E
npm run ci:e2e                     # Playwright E2E (CI mode, production serve)
npm run e2e                        # Playwright E2E (local, dev serve)
```

## Architecture

### Library Dependency Graph

The core `transloco` library is the foundation. All plugin libraries depend on it:

- **transloco** - Core i18n: service, directive, pipe, signal API, transpiler, loader, interceptor
- **transloco-locale** - Number/date localization using native `Intl` APIs
- **transloco-messageformat** - ICU message format via `@messageformat/core`
- **transloco-persist-lang** - Persist active language (localStorage/cookie/custom)
- **transloco-persist-translations** - Cache translations locally
- **transloco-preload-langs** - Preload languages on app init
- **transloco-scoped-libs** - Scoped translations for lazy-loaded features
- **transloco-optimize** - Build-time optimization webpack plugin
- **transloco-keys-manager** - CLI to extract/manage translation keys
- **transloco-schematics** - `ng add`/`ng generate` schematics
- **transloco-validator** - CLI to validate translation files
- **transloco-utils** - Shared Node.js utilities (used by keys-manager, schematics)
- **schematics-core** - Shared schematics utilities (internal, not published)

### Core Library Structure (`libs/transloco/src/lib/`)

- `transloco.service.ts` - Central service managing translations, language switching, lazy loading
- `transloco.directive.ts` - Structural directive `*transloco` for template translations
- `transloco.pipe.ts` - `transloco` pipe for inline template usage
- `transloco.signal.ts` - Signal-based API for standalone components
- `transloco.transpiler.ts` - Interpolation engine (default + custom transpilers)
- `transloco.loader.ts` - Translation file loader interface
- `transloco.interceptor.ts` - HTTP interceptor for adding language headers
- `transloco.providers.ts` - Standalone provider functions (`provideTransloco`)
- `transloco.module.ts` - NgModule-based setup (`TranslocoModule`)
- `scope-resolver.ts` / `lang-resolver.ts` - Resolve scoped/inline language keys

### Testing Setup

The core `transloco` library uses **Karma/Jasmine** for its main tests and **Jest** for schematics tests. Most plugin libraries use **Jest** only. The playground uses **Playwright** for E2E.

Test utility: `@ngneat/spectator` for Angular component testing.

### TypeScript Path Aliases

All libraries are mapped via `tsconfig.base.json` paths (e.g., `@jsverse/transloco` -> `libs/transloco/src/index.ts`), enabling cross-library imports during development.

## Conventions

### Commits

Format: `type(scope): subject` (max 64 chars). Use `npm run commit` for interactive prompt.

Scopes: `transloco`, `locale`, `messageformat`, `optimize`, `persist-lang`, `persist-translations`, `preload-langs`, `scoped-libs`, `utils`, `validator`, `schematics`

### Pre-commit Checks

Staged files are checked for: `debugger` statements in `.ts` files, `fit(`, `.skip(`, `.only(`, `fdescribe(` in `.spec.ts` files. Plus ESLint fix and Prettier formatting via lint-staged.

### Test Format

Tests follow given-when-then format (per recent commit convention).

### Release

All packages use fixed versioning (bump together). Conventional commits drive semantic version bumps. Tag pattern: `releases/{version}`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
