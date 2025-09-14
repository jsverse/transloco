# Hack the Library

In **Transloco**, you can extend and customize its behavior through several mechanisms: the **loader**, **interceptor**, **missing handler**, and **fallback strategy**. These tools allow you to control how translations are loaded, how translation data is processed before it's saved, how missing keys are handled, and how fallback languages are selected when the primary language fails to load.

This flexibility ensures that you can tailor Transloco to meet the specific needs of your application, whether you need to load translations from custom sources, manipulate translation data, or handle missing translations in a way that suits your use case.

Below are explanations and examples of how to implement and customize these features.

## The Loader

The **loader** allows you to override the default behavior of loading translation files.

```typescript
import { TranslocoLoader } from '@jsverse/transloco';

export class CustomLoader implements TranslocoLoader {
  getTranslation(lang: string) {
    if (langInLocalStorage) {
      return of(langFromStorage);
    }

    return ...; // Handle translation loading for other cases
  }
}
```

***

## The Interceptor

The **interceptor** gives you the ability to manipulate the translation object before it is saved by the service.

```typescript
import { TranslocoInterceptor } from '@jsverse/transloco';

export class CustomInterceptor implements TranslocoInterceptor {
  preSaveTranslation(translation: Translation, lang: string): Translation {
    return translation; // Modify translation object before saving
  }

  preSaveTranslationKey(key: string, value: string, lang: string): string {
    return value; // Modify translation key-value pair before saving
  }
}
```

***

## Missing Handler

The **missing handler** is responsible for handling missing keys. By default, it logs a warning in the console when `config.isProdMode` is set to `false` and returns an empty string for missing key values.

```typescript
import { TranslocoMissingHandler } from '@jsverse/transloco';

export class CustomHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig) {
    return '...'; // Provide a custom fallback for missing translation keys
  }
}
```

***

## Fallback Strategy

The **fallback strategy** is responsible for loading a fallback translation file if the selected active language fails to load. By default, it loads the language set in `config.fallbackLang` and uses it as the new active language.

If you need more control, you can define your own strategy:

```typescript
import { TranslocoFallbackStrategy } from '@jsverse/transloco';

export class CustomStrategy implements TranslocoFallbackStrategy {
  getNextLangs(failedLang: string) {
    return ['...']; // Return an array of fallback languages to load
  }
}
```

The `getNextLangs` method is called with the failed language and should return an array of languages to load, in order of preference.

####
