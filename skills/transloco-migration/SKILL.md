---
name: transloco-migration
description: Guides migrating an Angular project to Transloco from ngx-translate or Angular's built-in i18n, and upgrading between Transloco major versions (including the current v8-to-v9 breaking changes). Trigger when the user mentions ngx-translate, @angular/localize / i18n attributes, upgrading @jsverse/transloco, ng update for Transloco, or breaking changes / deprecated Transloco APIs.
license: MIT
metadata:
  author: Transloco maintainers
  version: '1.0'
---

# Transloco Migration

Use this skill for one-time transitional work, not everyday Transloco usage (see **transloco-core** for that).

## 1. Always confirm the starting point first

Before generating any migration code, check `package.json` for:

- Currently installed `@ngx-translate/core`, `@angular/localize`, `@ngneat/transloco*`, or `@jsverse/transloco*` versions.
- The installed Angular version, to know which Transloco major version is the valid migration target (see the compatibility table in **transloco-core**).

If the project uses the old `@ngneat/transloco*` scope, treat that as a rename-only migration to `@jsverse/transloco*` (same API) before applying anything else below.

## 2. Migrating from ngx-translate

Prefer running the official schematic over manual find/replace:

```bash
npm install -D @jsverse/transloco-schematics
ng g @jsverse/transloco-schematics:ngx-migrate
# Nx: nx g @jsverse/transloco-schematics:ngx-migrate
```

It recursively rewrites HTML/TS files. Key replacements it performs (validate matches when reviewing/writing manual patches too):

| ngx-translate                                            | Transloco                                               |
| -------------------------------------------------------- | ------------------------------------------------------- |
| `'key' \| translate`                                     | `'key' \| transloco`                                    |
| `'key' \| translate:{name:'x'}`                          | `'key' \| transloco:{name:'x'}`                         |
| `[translate]="'HELLO'" [translateParams]="{...}"`        | `[transloco]="'HELLO'" [translocoParams]="{...}"`       |
| `import { TranslateService } from '@ngx-translate/core'` | `import { TranslocoService } from '@jsverse/transloco'` |
| `translateService.currentLang`                           | `translateService.getActiveLang()`                      |
| `translateService.onLangChange`                          | `translateService.langChanges$`                         |
| `translateService.use(...)`                              | `translateService.setActiveLang(...)`                   |
| `translateService.instant(...)`                          | `translateService.translate(...)`                       |
| `translateService.get(...)`                              | `translateService.selectTranslate(...).pipe(take(1))`   |
| `translateService.stream(...)`                           | `translateService.selectTranslate(...)`                 |
| `translateService.set(...)`                              | `translateService.setTranslation(...)`                  |
| `TranslateModule.forChild({ loader: {...} })`            | `TranslocoModule`                                       |

No direct equivalent (flag for manual handling, don't invent one): `currentLoader`, `addLangs()`, `getLangs()`, `reloadLang()`, `resetLang()`. `getBrowserLang()`/`getBrowserCultureLang()` exist in Transloco too, but as plain importable functions, not service methods.

## 3. Migrating from Angular's built-in i18n (`@angular/localize`)

```bash
npm install -D @jsverse/transloco-schematics
ng g @jsverse/transloco-schematics:ng-migrate
```

- Extracts `i18n`/`i18n-<attr>` strings from HTML into a translations JSON file, converting the string to a kebab-case key (`"My sample string"` → `"my-sample-string"`).
- `i18n="context|comment"` becomes a `.comment`-suffixed companion key (see transloco-core's comments-for-translators convention); `@@myId` custom IDs become the object's nested key.
- Replaces `i18n`/`i18n-<attr>` directives with the `transloco` pipe.

## 4. Upgrading Transloco itself (v8 → v9)

v9 is currently alpha under the npm `next` tag (`@jsverse/transloco@next`). Confirm the user actually wants to move to alpha/v9 before applying this — otherwise stay on the current v8.x stable line.

```bash
ng update @jsverse/transloco --next   # or: nx migrate @jsverse/transloco@next && nx migrate --run-migrations
```

The migration automates:

- Renaming the removed `translocoRead` input / `read` microsyntax key to `translocoPrefix` / `prefix` (in both external templates and inline `template` strings). It **skips and logs** templates that fail to parse, and any element setting both `prefix` and `translocoRead` where the prefix is a dynamic/interpolated expression (only the running app can tell whether it evaluates empty) — review those by hand.
- Adding `provideGlobalTranslateFn()` to root providers wherever the standalone `translate()`/`translateObject()` functions are imported from `@jsverse/transloco` (detection is import-anchored, so a locally defined `translate` helper isn't mistaken for it). **The schematic has no SSR/MFE detection** — it adds the provider to every matching application project regardless. For SSR or multi-instance/micro-frontend apps, manually remove the generated provider afterwards and inject `TranslocoService` directly there instead.
- Declaring/reporting new peer-dependency floors: `@angular/core >=20`, `rxjs ^6.5.3 || ^7.4.0` for Transloco/Locale/Messageformat; `@angular/core >=20` for Persist Lang/Persist Translations/Preload Langs; `@angular/compiler >=20` + `typescript >=5.8` for Keys Manager. `ng update` refuses to proceed if the workspace doesn't satisfy the Angular floor.
- Reporting (not enforcing) the new **Node.js >=22** requirement for the CLI packages (`transloco-keys-manager`, `transloco-optimize`, `transloco-scoped-libs`, `transloco-utils`, `transloco-validator`).
- `@jsverse/transloco-keys-manager` moves into the main `jsverse/transloco` monorepo and jumps straight to the shared `9.0.0` version line — its CLI/config are unchanged.

Full detail: see `BREAKING_CHANGES.md` and `docs/v9/migration-guides/migrate-to-v9.md` in this repository — treat those (and the actual source under `libs/*/src`) as authoritative over any other summary, including this file, if they ever disagree.

## Anti-patterns

- Don't hand-write ngx-translate/Angular-i18n replacements file-by-file when the schematics above exist — run them first, then hand-fix only what they flag.
- Don't add `provideGlobalTranslateFn()` reflexively during a v9 upgrade without checking for SSR/micro-frontend setups first.
- Don't upgrade to `@next`/v9 for a production app without the user explicitly asking for the alpha line.
