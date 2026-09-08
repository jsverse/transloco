# Locale L10N (`@jsverse/transloco-locale`)

Adds localization (l10n) formatting on top of Transloco's translation (i18n) system, using native `Intl` APIs.

## Setup

```typescript
// app.config.ts (standalone)
providers: [provideTranslocoLocale(), ...]
```

For NgModule apps, provide it (and import `TranslocoLocaleModule` if using the module form) in `TranslocoRootModule`.

## Pipes

```html
<span>{{ date | translocoDate }}</span>
<span
  >{{ date | translocoDate: { dateStyle: 'medium', timeStyle: 'medium' }
  }}</span
>
<span>{{ date | translocoDate: { timeZone: 'UTC', timeStyle: 'full' } }}</span>

<span>{{ 1000000 | translocoCurrency }}</span>
<span>{{ 1000000 | translocoCurrency: 'name' }}</span>
<span
  >{{ 1000000 | translocoCurrency: 'symbol' : { minimumFractionDigits: 0 }
  }}</span
>

<span>{{ 1234567890 | translocoDecimal }}</span>
<span>{{ 1234567890 | translocoDecimal: { useGrouping: false } }}</span>

<span>{{ 1 | translocoPercent }}</span>
```

## Setting the locale (pick one)

1. **Locale-specific file names** — `i18n/en-US.json`, `i18n/en-GB.json`; locale auto-derives from `langChanges$`.
2. **Language→locale mapping**:
   ```typescript
   provideTranslocoLocale({
     langToLocaleMapping: { en: 'en-US', es: 'es-ES' },
   });
   ```
3. **Manual**: `inject(TranslocoLocaleService).setLocale('en-US')`.

## Config

```typescript
provideTranslocoLocale({
  localeConfig: { global: { date: { dateStyle: 'long', timeStyle: 'long' } } },
});
```

Component-level override: `providers: [provideTranslocoLocaleConfig(localeConfig)]`.

## Service API

`TranslocoLocaleService`: `localeChanges$`, `localizeDate()`, `localizeNumber()`, `setLocale()`, `getCurrencySymbol()`.

## Custom transformers (advanced)

Extend `DefaultDateTransformer` / `DefaultNumberTransformer` and register via `provideTranslocoDateTransformer(...)` / `provideTranslocoNumberTransformer(...)`.

Anti-pattern: formatting dates/numbers with raw `Intl` calls or `DatePipe`/`CurrencyPipe` scattered through the app instead of centralizing via this plugin — you lose the locale auto-derivation from the active language.
