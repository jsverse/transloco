---
name: transloco-core
description: Generates idiomatic Angular code using @jsverse/transloco, the i18n library for Angular. Trigger when adding or editing translations, choosing between translate()/selectTranslate()/signals, using the *transloco structural directive, transloco pipe, or attribute directive, configuring TranslocoService or provideTransloco(), setting up scopes/lazy-loaded translation files, or writing tests for components that use Transloco.
license: MIT
metadata:
  author: Transloco maintainers
  version: '1.0'
---

# Transloco Core

Transloco (`@jsverse/transloco`) is the i18n library for Angular. Use this skill for everyday translation work: choosing the right API, wiring up config, scopes, and tests.

For plugins (locale formatting, ICU messages, persisting language, preloading, validation, optimize, scoped libs), use the **transloco-plugins** skill. For upgrading a project or migrating from ngx-translate / Angular's built-in i18n, use **transloco-migration**. For automated key extraction, use **transloco-keys-manager**.

## 0. Always check the project's installed version first

Angular and Transloco major versions are tightly coupled. Before generating code, inspect `package.json`:

| Angular    | `@jsverse/transloco` | Notes                                                                                                                                                                             |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `>=20`     | `9.x`                | Alpha/`next` tag while 9.0.0 is unreleased. `translocoRead` input and automatic `translate()`/`translateObject()` wiring are **removed** — requires `provideGlobalTranslateFn()`. |
| `>=16 <20` | `>=5 <=8`            | Current stable line. `translocoRead` still works (deprecated), `translate()`/`translateObject()` work without extra providers.                                                    |

Rules:

- Do not use v9-only APIs (`provideGlobalTranslateFn()`) unless `package.json` shows a `@jsverse/transloco` version `>=9.0.0` (including prereleases like `9.0.0-alpha.1`, resolved via the `@next` dist-tag or an explicit pin) — or the user explicitly asks to upgrade.
- Packages under the old `@ngneat/transloco*` scope are unmaintained — if you see them, recommend migrating to `@jsverse/transloco` (same API, scope rename only) rather than adding new code against them.
- If no version can be determined (new project), default to the current stable API (v8) unless the user asks for v9/`next`.

## 1. Choosing the right translation API

`TranslocoService` (inject it, don't instantiate it) exposes both a synchronous and an observable/signal API:

- **`translate(key, params?, lang?)`** — synchronous, returns the translation immediately. **Only safe once translations are loaded.** Prefer this inside already-guarded code (e.g. after `selectTranslate`/`langChanges$` has emitted) or in event handlers.
- **`selectTranslate(key, params?, lang?)`** — returns an `Observable<string>`, auto-loads the file if needed, and re-emits on language change. **Default choice** for anything rendered on init or reacting to language changes.
- **`translateSignal(key, params?, lang?)`** / **`translateObjectSignal(...)`** (from `@jsverse/transloco`, not the service) — signal-based equivalents of `selectTranslate`/`selectTranslateObject`. Prefer these in **new, signal-based components** instead of subscribing manually.
- **`translate()`/`translateObject()`** standalone functions — convenience proxies to the service, usable outside DI (e.g. plain functions). Same "must be loaded" caveat as `service.translate()`. **On v9+, require `provideGlobalTranslateFn()`** in root providers, and must be **omitted** in SSR and multi-instance/micro-frontend setups (inject `TranslocoService` directly there instead).
- **`getTranslation()`/`setTranslation()`/`setTranslationKey()`** — read/write the in-memory translation map directly; use sparingly (e.g. dynamic runtime overrides), not as the primary translation mechanism.

Anti-pattern: calling `translate()` (service method or standalone function) before the language has loaded — it silently returns `''`/warns. If you're not sure translations are loaded yet, use `selectTranslate()`.

## 2. Choosing the right template API

- **Structural directive `*transloco="let t"`** — recommended default. One subscription per template, memoized `t()` calls, supports `prefix`, `scope`, `lang`, `read` (deprecated alias, pre-v9 only), and `loadingTpl` inputs.
- **`transloco` pipe** — good for a single interpolation or attribute/property binding (`[title]="'key' | transloco"`), but creates a new subscription per usage; avoid using it many times in the same template when the structural directive would cover them all.
- **Attribute directive `transloco="key"`** — good for simple static text nodes without needing the `let t` context, supports `[translocoParams]` and `translocoLang`.

Anti-pattern: repeating `{{ 'foo' | transloco }}` many times in one template instead of one `*transloco="let t"` wrapping the block — this creates redundant subscriptions and duplicates the same translation lookups.

## 3. Config

See [references/config.md](references/config.md) for the full `provideTransloco()`/`translocoConfig()` option list (defaults, `fallbackLang`, `missingHandler`, `interpolation`, `scopes.keepCasing`, etc.).

## 4. Scopes, lazy loading, multi-language, custom loaders

See [references/scopes-and-loaders.md](references/scopes-and-loaders.md) for `provideTranslocoScope()`, inline loaders, per-component/inline language overrides (`provideTranslocoLang`, `lang` input, `|static` suffix), loading templates, and the transpiler/hack-the-library extension points (custom loader, interceptor, missing handler, fallback strategy).

## 5. Testing and SSR

See [references/testing-and-ssr.md](references/testing-and-ssr.md) for `TranslocoTestingModule` setup (including scoped translations in tests) and SSR-specific caveats (`provideGlobalTranslateFn()`, absolute loader paths, `baseUrl`).

## 6. Common anti-patterns checklist

- Don't call `translate()`/standalone `translate()` before translations are guaranteed loaded — use `selectTranslate()`/`translateSignal()`.
- Don't declare `provideTranslocoScope(...)` at the root/`AppModule` level for a scope that's only used by one lazy route — scopes follow Angular DI rules and should live in the lazy route's providers or the component's providers so they load on demand.
- Don't use the deprecated `translocoRead` input / `read` microsyntax key in new code — use `translocoPrefix` / `prefix` instead.
- Don't use `provideGlobalTranslateFn()` in SSR or multi-instance/micro-frontend apps — inject `TranslocoService` instead.
- Don't hand-roll date/number/currency formatting — use the `transloco-plugins` skill's locale reference (`@jsverse/transloco-locale`) instead of custom pipes.
- Don't manually keep translation JSON files in sync across languages — point the user at the `transloco-keys-manager` skill.
