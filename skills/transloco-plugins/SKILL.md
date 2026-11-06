---
name: transloco-plugins
description: Guides selection and setup of official @jsverse/transloco plugins - locale/l10n formatting, ICU messageformat, persisting the active language or loaded translations, preloading languages, translation file validation, production build optimization, and scoped library translation extraction. Trigger when the user needs date/number/currency formatting, plurals/gender rules, remembering the user's language across sessions, caching translation files, preloading languages, validating i18n JSON, shrinking translation bundles for production, or sharing translations from a publishable Angular library.
license: MIT
metadata:
  author: Transloco maintainers
  version: '1.0'
---

# Transloco Plugins

Official `@jsverse/transloco-*` plugins solve specific, opt-in problems on top of core Transloco (see the **transloco-core** skill for the base API). Pick the plugin that matches the need — don't hand-roll behavior these already provide.

| Need                                                              | Plugin                                    | Reference                                                                |
| ----------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| Format dates/numbers/currency/percent per locale                  | `@jsverse/transloco-locale`               | [references/locale.md](references/locale.md)                             |
| ICU plural/select/gender syntax in translations                   | `@jsverse/transloco-messageformat`        | [references/messageformat.md](references/messageformat.md)               |
| Remember the user's active language across sessions               | `@jsverse/transloco-persist-lang`         | [references/persist-lang.md](references/persist-lang.md)                 |
| Cache loaded translation files (reduce network requests)          | `@jsverse/transloco-persist-translations` | [references/persist-translations.md](references/persist-translations.md) |
| Eagerly preload languages during idle time                        | `@jsverse/transloco-preload-langs`        | [references/preload-langs.md](references/preload-langs.md)               |
| Lint translation JSON files (duplicate keys, invalid JSON)        | `@jsverse/transloco-validator`            | [references/validator.md](references/validator.md)                       |
| Shrink/flatten translation files for production builds            | `@jsverse/transloco-optimize`             | [references/optimize.md](references/optimize.md)                         |
| Ship translations inside a publishable Angular library (monorepo) | `@jsverse/transloco-scoped-libs`          | [references/scoped-libs.md](references/scoped-libs.md)                   |

All packages follow the same install/version rule as `@jsverse/transloco` itself: match the major version to the installed Angular version (see the **transloco-core** skill's compatibility table), and use the `@next` dist-tag only while targeting Angular >=20 / Transloco v9 (alpha).

CLI plugins (`transloco-validator`, `transloco-optimize`, `transloco-scoped-libs`) additionally require **Node.js >=22** as of v9.

## Anti-patterns

- Don't write custom `Intl.DateTimeFormat`/`Intl.NumberFormat` pipes when `transloco-locale` already provides `translocoDate`/`translocoCurrency`/`translocoDecimal`/`translocoPercent`.
- Don't build custom ICU-like plural logic in translation strings/functional-transpiler functions — use `transloco-messageformat`.
- Don't skip `transloco-persist-translations`' `ttl`/`storageKey` options and roll your own cache invalidation.
- Don't manually copy a library's i18n files into the app's assets folder on every change — that's exactly what `transloco-scoped-libs` automates.
