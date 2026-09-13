# Persist Language (`@jsverse/transloco-persist-lang`)

Persists the active language to storage and restores it on the next visit.

```typescript
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

providers: [
  provideTranslocoPersistLang({
    storage: { useValue: localStorage },
  }),
];
```

Default behavior: use the cached language if present, else the config's `defaultLang`. Customize with `getLangFn`:

```typescript
export function getLangFn({
  cachedLang,
  browserLang,
  cultureLang,
  defaultLang,
}) {
  return yourLogic;
}

provideTranslocoPersistLang({ getLangFn, storage: { useValue: localStorage } });
```

For SSR, use the bundled `cookiesStorage()` instead of `localStorage` (cookies are readable server-side, localStorage is not):

```typescript
import {
  provideTranslocoPersistLang,
  cookiesStorage,
} from '@jsverse/transloco-persist-lang';

provideTranslocoPersistLang({ storage: { useValue: cookiesStorage() } });
```

Anti-pattern: reading/writing `localStorage` manually in an app-level service to remember the language — this plugin already covers that, including the SSR-safe cookie option.
