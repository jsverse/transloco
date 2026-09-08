# Testing & SSR

## Unit testing with `TranslocoTestingModule`

Tests need languages available synchronously. Create a reusable factory:

```typescript
// transloco-testing.module.ts
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import en from '../assets/i18n/en.json';
import es from '../assets/i18n/es.json';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { en, es },
    translocoConfig: { availableLangs: ['en', 'es'], defaultLang: 'en' },
    preloadLangs: true,
    ...options,
  });
}
```

```typescript
TestBed.configureTestingModule({
  imports: [getTranslocoModule()],
});
```

Requires `resolveJsonModule` and `esModuleInterop` in `tsconfig.json` to import the JSON files directly.

### Testing scopes

Register scoped translations as additional "languages" keyed `'<scope>/<lang>'`:

```typescript
TranslocoTestingModule.forRoot({
  langs: { en, es, 'admin-page/en': admin, 'admin-page/es': adminSpanish },
  translocoConfig: { availableLangs: ['en', 'es'], defaultLang: 'en' },
  preloadLangs: true,
});
```

Anti-pattern: mocking `TranslocoService` by hand in every spec — use `TranslocoTestingModule` so real directive/pipe behavior (memoization, scope resolution) is exercised.

## SSR

- Run `ng add @jsverse/transloco@next` (or the SSR option in `ng-add`) to get SSR-specific wiring: it switches the loader's base path from relative to **absolute**, since relative paths don't resolve on the server.
- Transloco adds a `baseUrl` key to `environment.ts` — set it to your app's origin per environment.
- **Do not use `provideGlobalTranslateFn()`** (the provider enabling the standalone `translate()`/`translateObject()` functions) in SSR apps, nor in multi-instance/micro-frontend setups — both run more than one Transloco instance and a global function can't know which one to resolve against. Inject `TranslocoService` directly instead.
