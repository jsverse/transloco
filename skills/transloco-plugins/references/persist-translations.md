# Persist Translations (`@jsverse/transloco-persist-translations`)

Caches loaded translation files in storage to reduce repeated network requests. **Do not also register the default HTTP loader** when using this plugin — provide it via this plugin's `loader` option instead.

## LocalStorage

```typescript
import { provideTranslocoPersistTranslations } from '@jsverse/transloco-persist-translations';

providers: [
  provideTranslocoPersistTranslations({
    loader: TranslocoHttpLoader, // your existing loader class (e.g. auto-generated via ng-add)
    storage: { useValue: localStorage },
  }),
];
```

## Async storage (e.g. IndexedDB via `localforage`)

```typescript
import * as localForage from 'localforage';

localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'Transloco',
  storeName: 'translations',
});

provideTranslocoPersistTranslations({
  loader: TranslocoHttpLoader,
  storage: { useValue: localForage },
});
```

## Options

| Option       | Type     | Purpose                                         |
| ------------ | -------- | ----------------------------------------------- |
| `ttl`        | `number` | Cache time-to-live in seconds.                  |
| `storageKey` | `string` | Custom key under which translations are stored. |

## Clearing cache

Cache auto-clears on `ttl` expiry, or manually. Inject it in a valid injection context (e.g. a constructor or field initializer) and store it for later use:

```typescript
export class MyComponent {
  private persistTranslations = inject(TranslocoPersistTranslations);

  clearTranslationsCache() {
    this.persistTranslations.clearCache();
  }
}
```

Anti-pattern: keeping the default HTTP loader registered alongside this plugin's loader wrapper — that causes duplicate/uncached requests.
