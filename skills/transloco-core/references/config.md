# Transloco Configuration

`provideTransloco({ config, loader })` (or `translocoConfig({...})` for the `TRANSLOCO_CONFIG` token directly) accepts:

```typescript
provideTransloco({
  config: {
    availableLangs: ['en', 'es'],
    defaultLang: 'en',
    // Remove this option if your application doesn't support changing language at runtime.
    reRenderOnLangChange: true,
    prodMode: !isDevMode(),
    fallbackLang: 'es', // or ['en', 'ru']
    failedRetries: 1,
    missingHandler: {
      allowEmpty: true,
      useFallbackTranslation: true,
      logMissingKey: isDevMode(),
    },
    flatten: {
      aot: !isDevMode(), // pairs with the transloco-optimize plugin
    },
    interpolation: ['<<<', '>>>'],
    scopes: {
      keepCasing: false,
    },
  },
  loader: TranslocoHttpLoader,
});
```

| Option                                  | Default        | Purpose                                                                                                                                                           |
| --------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `availableLangs`                        | —              | List of supported languages (or `{ id, label }[]` objects).                                                                                                       |
| `defaultLang`                           | `'en'`         | Language used before the active language is resolved.                                                                                                             |
| `reRenderOnLangChange`                  | `false`        | Set `true` if users can switch language at runtime; keep `false` for static/single-language builds to save memory (renders once, unsubscribes).                   |
| `prodMode`                              | `false`        | When `true`, disables Transloco's console warnings. Wire to `!isDevMode()`.                                                                                       |
| `fallbackLang`                          | —              | One or more languages to fall back to when a translation/file is missing. Customize selection via a `TranslocoFallbackStrategy` (see hack-the-library reference). |
| `failedRetries`                         | `2`            | Retry count for failed translation file loads.                                                                                                                    |
| `missingHandler.allowEmpty`             | `false`        | Allow empty string values for missing keys instead of falling back.                                                                                               |
| `missingHandler.useFallbackTranslation` | `false`        | Use `fallbackLang`'s value for a key missing in the active language.                                                                                              |
| `missingHandler.logMissingKey`          | `true`         | Log missing-key warnings in dev mode.                                                                                                                             |
| `flatten.aot`                           | —              | Enables AOT flattening compatibility; use together with `@jsverse/transloco-optimize`.                                                                            |
| `interpolation`                         | `['{{', '}}']` | Start/end markers for params in translation strings, e.g. `Hello {{name}}`.                                                                                       |
| `scopes.keepCasing`                     | `false`        | Preserve a scope's original casing as its namespace instead of camel-casing it (ignored if an `alias` is set).                                                    |

Anti-pattern: setting `reRenderOnLangChange: true` for an app that never changes language at runtime — it keeps an active subscription per template unnecessarily.
