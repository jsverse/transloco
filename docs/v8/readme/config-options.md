# Config Options

## **`reRenderOnLangChange`**

For applications that don't allow users to change the language dynamically (e.g., via a dropdown), set this to `false`. This will save memory by rendering the view once and unsubscribing from the language change event. (Defaults to `false`.)

```typescript
translocoConfig({
  reRenderOnLangChange: boolean,
});
```

## **`defaultLang`**

Sets the default language for the application. (Defaults to `'en'`.)

```typescript
translocoConfig({
  defaultLang: 'en',
});
```

## **`fallbackLang`**

Defines one or more fallback languages to use when a translation is unavailable. See the **TranslocoFallbackStrategy** section for customization options.

```typescript
translocoConfig({
  fallbackLang: 'en',
  fallbackLang: ['en', 'ru'],
});
```

## **`failedRetries`**

Specifies the number of retries for loading translation files in case of failure. (Defaults to `2`.)

```typescript
translocoConfig({
  failedRetries: 1,
});
```

## **`prodMode`**

Indicates whether the application is running in production mode. (Defaults to `false`.) When enabled, Transloco will disable all console warnings.

```typescript
import { isDevMode } from '@angular/core';

translocoConfig({
  prodMode: !isDevMode(),
});
```

## **`availableLangs`**

Lists the available languages in your application.

```typescript
translocoConfig({
  availableLangs: ['en', 'es'],
});
```

## **`missingHandler.allowEmpty`**

Specifies whether to allow empty values when a translation is missing. (Defaults to `false`.)

```typescript
translocoConfig({
  missingHandler: {
    allowEmpty: true,
  },
});
```

## **`missingHandler.useFallbackTranslation`**

Determines whether to use the fallback language for missing keys or values. (Defaults to `false`.)

```typescript
translocoConfig({
  fallbackLang: 'en',
  missingHandler: {
    useFallbackTranslation: true,
  },
});
```

## **`missingHandler.logMissingKey`**

Specifies whether to log a warning to the console when a translation key is missing. (Defaults to `true`.)

```typescript
translocoConfig({
  missingHandler: {
    logMissingKey: false,
  },
});
```

## **`flatten.aot`**

Check the optimization plugin for Ahead-of-Time (AOT) compilation.

```typescript
import { isDevMode } from '@angular/core';

translocoConfig({
  flatten: {
    aot: !isDevMode(),
  },
});
```

## **`interpolation`**

Defines the start and end markers for parameters in translations. (Defaults to `['{{', '}}']`.)

```typescript
translocoConfig({
  // This allows specifying parameters like: `"Hello <<<value>>>"`
  interpolation: ['<<<', '>>>'],
});
```

## **`scopes.keepCasing` v7.5.0+**

Ensures that the casing of the scope name is preserved unless an alias has been set. If no alias is set, this option will be ignored.

```typescript
translocoConfig({
  scopes: {
    keepCasing: false,
  },
});
```

***

This version aims to clarify the purpose of each option and maintain a consistent style for code examples.
