---
description: Check all public API exports across Transloco libraries for unintended changes
allowed-tools: Read Grep Glob Bash(git:*)
---

Check the public API surface of all Transloco libraries:

1. For each library in `libs/*/`, find and read the main entry point (`src/index.ts` or `src/public-api.ts` or `src/public_api.ts`)
2. List all exports (functions, classes, interfaces, types, constants, modules)
3. Compare against the last release tag to detect changes:
   - Run `git tag --list 'releases/*' --sort=-v:refname | head -1` to find the latest release tag (tags follow the `releases/{version}` pattern)
   - Run `git diff <tag>..HEAD -- <entry-file>` for each library
4. Flag:
   - **Removed exports** (breaking change)
   - **Renamed exports** (breaking change)
   - **Changed export types** (e.g., class -> function)
   - **New exports** (non-breaking, just informational)
   - **Exports that look internal** (prefixed with `_`, contain `internal`, etc.)

Output a summary table:

```
| Library | New | Removed | Changed | Status |
|---------|-----|---------|---------|--------|
| transloco | 2 | 0 | 0 | OK |
| transloco-locale | 0 | 1 | 0 | BREAKING |
```

Then detail any breaking changes found.
