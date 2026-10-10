# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Transloco is an internationalization (i18n) library for Angular, published under the `@jsverse` npm scope. It's an Nx monorepo with 15 libraries and a playground app.

## Common Commands

```bash
# Development
pnpm start                         # Serve playground app
pnpm commit                        # Interactive conventional commit (git-cz)

# Build
pnpm ci:build                      # Build all packages
nx build <package-name>            # Build single package

# Test
pnpm ci:test                       # Test all packages
nx test <package-name>             # Test single package
nx test-library transloco          # Core library tests (Vitest)
nx test-schematics transloco       # Core schematics tests (Vitest)

# Lint
pnpm ci:lint                       # Lint all packages
nx lint <package-name>             # Lint single package

# Format (Prettier, via Nx's built-in formatter)
pnpm format                        # Format files affected vs. base branch
pnpm format:check                  # Check formatting of files affected vs. base branch
pnpm ci:format                     # Check formatting of the whole repo (used in CI)

# E2E
pnpm ci:e2e                        # Playwright E2E (CI mode, production serve)
pnpm e2e                           # Playwright E2E (local, dev serve)
```

## Architecture

### Library Dependency Graph

The core `transloco` library is the foundation. The runtime plugin libraries depend on it; the CLI and the tool packages built on it do not:

- **transloco** - Core i18n: service, directive, pipe, signal API, transpiler, loader, interceptor
- **transloco-locale** - Number/date localization using native `Intl` APIs
- **transloco-messageformat** - ICU message format via `@messageformat/core`
- **transloco-persist-lang** - Persist active language (localStorage/cookie/custom)
- **transloco-persist-translations** - Cache translations locally
- **transloco-preload-langs** - Preload languages on app init
- **transloco-scoped-libs** - Deprecated shim over `transloco-cli`: the `transloco-scoped-libs` bin prints a deprecation notice and runs `transloco scoped-libs`
- **transloco-optimize** - Deprecated shim over `transloco-cli`: the `transloco-optimize` bin prints a deprecation notice and runs `transloco optimize`
- **transloco-cli** - Unified `transloco` CLI with the commands `extract`, `find`, `validate`, `optimize`, `scoped-libs`, `join`, `split`, `migrate ngx-translate`, `migrate angular-i18n` and `init`; also exports `marker` (`@jsverse/transloco-cli/marker`) and `getGlobalConfig`
- **transloco-keys-manager** - Deprecated shim over `transloco-cli`: the `transloco-keys-manager` bin prints a deprecation notice and runs `transloco extract` / `transloco find`; its `marker` export is deprecated in favour of `@jsverse/transloco-cli/marker`
- **transloco-schematics** - `ng add`/`ng generate` schematics; its `join`, `split`, `ngx-migrate` and `ng-migrate` schematics are deprecated in favour of the CLI commands
- **transloco-validator** - Deprecated shim over `transloco-cli`: the `transloco-validator` bin prints a deprecation notice and runs `transloco validate`
- **transloco-utils** - Deprecated, frozen config reader (`getGlobalConfig`) kept for existing consumers. The `TranslocoGlobalConfig` type now lives in `transloco`, and `getGlobalConfig` in `transloco-cli`
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

All libraries and the playground use **Vitest** for unit tests, via the `@nx/vitest:test` executor. Each project's `vitest.config.ts` calls the `defineAngularProject`/`defineNodeProject` factory in `tools/vitest/define-project.ts` (which merges the shared `tools/vitest/vitest.base.ts`) and passes only what it owns (`name`, `root`, `coverageDir`, `include`, `setupFiles`). Angular libs compile through `@analogjs/vite-plugin-angular` in a `jsdom` environment; Node/CLI libs use the `node` environment. The playground uses **Playwright** for E2E.

Test utility: `@ngneat/spectator` (imported from `@ngneat/spectator/vitest`) for Angular component testing. Schematic tests (`SchematicTestRunner`) load `.ts` factories through a `@swc-node/register` require hook in `tools/vitest/setup-schematics.ts`.

The CLI also has a black-box golden suite (`nx run transloco-cli:test-golden`, or `pnpm ci:golden`): every case under `libs/transloco-cli/tests/golden/cases` runs the built `transloco` bin in a throwaway directory and compares the files it wrote, its exit code and, where it is part of the contract, its output. Cases are regenerated with `GOLDEN_UPDATE=1` (see `libs/transloco-cli/tests/golden/README.md`), and existing golden cases are not edited unless the behaviour they pin down is meant to change.

### TypeScript Path Aliases

All libraries are mapped via `tsconfig.base.json` paths (e.g., `@jsverse/transloco` -> `libs/transloco/src/index.ts`), enabling cross-library imports during development.

## Conventions

### Commits

Format: `type(scope): subject` (max 64 chars). Use `pnpm commit` for interactive prompt.

Scopes: `transloco`, `cli`, `locale`, `messageformat`, `optimize`, `persist-lang`, `persist-translations`, `preload-langs`, `scoped-libs`, `utils`, `validator`, `schematics`

### Pre-commit Checks

Staged files are checked for: `debugger` statements in `.ts` files, `fit(`, `.only(`, `fdescribe(` in `.spec.ts` files. Plus ESLint fix and Prettier formatting via lint-staged. (`.skip(` is intentionally not blocked — since Vitest has no `xit` alias, `it.skip(` is the only idiom for intentional, documented skips.)

### Test Format

Tests follow given-when-then format (per recent commit convention).

### Release

All packages use fixed versioning (bump together). Conventional commits drive semantic version bumps. Tag pattern: `releases/{version}`.

Real (non-dry-run) releases are announced in Discord `#releases` by `.github/workflows/scripts/announce-release.mts`, posting to the webhook in the `DISCORD_RELEASES_WEBHOOK` secret. Best-effort: it self-skips when the secret is unset, and the step is `continue-on-error`.

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
