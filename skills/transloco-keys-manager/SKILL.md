---
name: transloco-keys-manager
description: Automates Transloco translation key workflows using the Transloco Keys Manager (TKM) CLI - extracting keys used in code/templates into translation files, finding missing or unused (extra) keys across languages, and marking dynamic/computed keys for extraction. Trigger when the user wants to auto-generate translation JSON from source code, find missing or unused translation keys, or configure the extract/find CLI commands.
license: MIT
metadata:
  author: Transloco maintainers
  version: '1.0'
---

# Transloco Keys Manager (TKM)

CLI tool (`@jsverse/transloco-keys-manager`) that scans TypeScript/HTML for translation key usage and keeps translation JSON files in sync — use it instead of manually adding/removing keys across every language file. Requires Node.js `>=22`, `@angular/compiler >=20`, `typescript >=5.8` (v9+; as of v9 it lives in the main `jsverse/transloco` monorepo but its CLI/config are unchanged from v8).

## Setup

```bash
npm install -D @jsverse/transloco-keys-manager
# on Angular >=20 / Transloco v9 (still alpha): npm install -D @jsverse/transloco-keys-manager@next
```

```json
"scripts": {
  "i18n:extract": "transloco-keys-manager extract",
  "i18n:find": "transloco-keys-manager find"
}
```

Or via schematics: install `@jsverse/transloco-schematics` as a dev dependency, then run `ng g @jsverse/transloco-schematics:keys-manager` (choose CLI, Webpack plugin, or both).

```bash
npm install -D @jsverse/transloco-schematics
ng g @jsverse/transloco-schematics:keys-manager
```

## `extract` — generate/update translation files

```bash
npm run i18n:extract
```

Scans source for translation key usage and writes/updates the target translation JSON. It understands, out of the box:

- Scopes declared via `provideTranslocoScope(...)` — extracts into the matching subfolder (e.g. `i18n/admin/en.json`).
- Inline loaders — map them via `scopePathMap` in `transloco.config.ts` (see transloco-core's global config reference) so keys land in the right folder.
- The `prefix` input — `t('title')` under `*transloco="let t; prefix: 'dashboard'"` extracts as `dashboard.title`.
- Literal params — `t('key', {value: '123'})`; **dynamic param objects are not extracted** (`translocoService.translate('key', this.myParams)` won't be picked up).
- Static ternaries in pipe/directive/attribute usage (`condition ? 'keyOne' : 'keyTwo' | transloco`).

### Dynamic keys

For computed keys the extractor can't statically resolve, add an extraction comment:

```typescript
// TypeScript — file must import from (or comment-reference) '@jsverse/transloco'
/**
 * t(key.typeOne.postfix, key.typeTwo.postfix)
 */
someMethod() {
  translocoService.translate(`key.${type}.postfix`);
}
```

```html
<!-- HTML — comment must contain ONLY the marker(s), no other text -->
<!-- t(I.am.going.to.extract.it, this.is.cool) -->
```

Comments inside a `prefix`-scoped block inherit that prefix automatically.

### Marker function (standalone strings, not part of a translate call)

```typescript
import { marker } from '@jsverse/transloco-keys-manager';
// or: import { marker as _ } from '@jsverse/transloco-keys-manager';

static titles = { username: marker('auth.username') }; // returns 'auth.username' at runtime
```

## `find` (Keys Detective) — audit existing files

```bash
npm run i18n:find
```

Reports: (1) keys present in one language file but missing from others, (2) keys defined in translation files but unused anywhere in code/templates ("extra" keys).

## Key CLI options (`extract`)

| Flag                      | Purpose                                                                                           | Default                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `-i, --input`             | Source dirs to scan                                                                               | `${sourceRoot}/app` (or `/lib` for libraries) |
| `-o, --output`            | Output dir for translation files                                                                  | `${sourceRoot}/assets/i18n`                   |
| `-l, --langs`             | Languages to generate                                                                             | `[en]`                                        |
| `-f, --fileFormat`        | `json` or `pot`                                                                                   | `json`                                        |
| `-m, --marker`            | Marker function name                                                                              | `t`                                           |
| `-r, --replace`           | Overwrite existing files instead of merging                                                       | `false`                                       |
| `-R, --remove-extra-keys` | Remove keys no longer used in code                                                                | `false`                                       |
| `-d, --defaultValue`      | Placeholder value template (supports `{{key}}`, `{{keyWithoutScope}}`, `{{scope}}`, `{{params}}`) | `Missing value for {{key}}`                   |
| `-u, --unflat`            | Nest keys instead of flat dotted keys                                                             | flat                                          |
| `--sort`                  | Sort keys                                                                                         | `false`                                       |
| `-c, --config`            | Root dir to search for `transloco.config.ts`                                                      | `process.cwd()`                               |
| `--project`               | Target Nx/Angular project (prefixes defaults with its `sourceRoot`)                               | `defaultProject`                              |

`find` also has `-a, --add-missing-keys` (add keys `find` flagged as missing), `-e, --emit-error-on-extra-keys` (fail CI on unused keys), and `-p, --translationsPath`.

Only a subset of these can be set once via the shared `keysManager` block in the project's `transloco.config.ts` (see transloco-core's global config reference): `input`, `output`, `fileFormat`, `marker`, `addMissingKeys`, `emitErrorOnExtraKeys`, `replace`, `defaultValue`, `unflat`, `sort` — plus the top-level `langs` and `rootTranslationsPath` fields. CLI-only options like `-c/--config` and `--project`, and the unsupported `removeExtraKeys`, cannot be configured there and must be passed as CLI flags.

## Anti-patterns

- Don't manually create/delete keys across every language file — run `extract`/`find` and let the tool merge.
- Don't wrap genuinely dynamic, unbounded key expressions in `marker()` expecting extraction magic — `marker()` is for known, static strings only; use the extraction-comment syntax for truly dynamic keys instead.
- Don't pass a dynamic object as translate params and expect it to be extracted — only literal param objects are picked up; refactor to literal params if extraction matters.
