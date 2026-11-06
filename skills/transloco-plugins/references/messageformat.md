# Message Format (`@jsverse/transloco-messageformat`)

Integrates `@messageformat/core` so translations can use **ICU syntax** for pluralization/gender/select rules. Fully compatible with the default transpiler — switching doesn't break existing plain translations.

## Translation file syntax

```json
{
  "mySelectRule": "{myVar, select, val1 {Value 1} val2 {Value 2} other {Other Value}}",
  "myPluralRule": "{myCount, plural, =0 {no results} one {1 result} other {# results}}"
}
```

## Setup

```typescript
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

providers: [provideTranslocoMessageformat()];
```

(root providers for standalone apps, or `TranslocoRootModule` providers for NgModule apps)

## Options

```typescript
provideTranslocoMessageformat({
  locales: 'en-GB', // or ['en-GB', 'fr'] — first is MessageFormat's default
  biDiSupport: true, // RTL languages
  customFormatters: { upcase: (v: string) => v.toUpperCase() },
  enableCache: false, // disable compiled-output caching (default: cached)
});
```

Anti-pattern: implementing plural/gender branching manually with the `FunctionalTranspiler` (transloco-core) or string concatenation — use ICU syntax via this plugin instead, it's the purpose-built tool for linguistic plural/select rules.
