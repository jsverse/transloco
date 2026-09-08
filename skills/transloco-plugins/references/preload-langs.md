# Preload Languages (`@jsverse/transloco-preload-langs`)

Preloads specified languages/scopes during browser idle time via `requestIdleCallback`, so they're ready before the user needs them (without blocking initial render like eager-loading everything upfront would).

```typescript
import { provideTranslocoPreloadLangs } from '@jsverse/transloco-preload-langs';

providers: [provideTranslocoPreloadLangs(['es', 'some-scope'])];
```

Use this when the app has a small, known set of languages/scopes and you want to reduce the delay when the user switches language or navigates to a lazy scope — not as a substitute for lazy loading itself (it complements it).

Anti-pattern: eagerly importing every language's JSON at bootstrap instead of using this plugin — that blocks initial load; this plugin preloads opportunistically during idle time instead.
