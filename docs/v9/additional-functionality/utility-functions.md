---
icon: wrench-simple
---

# Utility Functions

## **`translate()`**

The `translate()` function allows you to translate a single key without needing to inject the `TranslocoService` each time.

```typescript
import { translate } from '@jsverse/transloco';

translate('hello');
```

{% hint style="warning" %}
**Requires `provideGlobalTranslateFn()`**\
As of v9 this function is no longer wired up automatically. Add [`provideGlobalTranslateFn()`](#provideglobaltranslatefn) to your root providers, or it returns `''` and warns in development mode.
{% endhint %}

{% hint style="info" %}
**Important**\
This function is a proxy to the `TranslocoService.translate` method. It will not work if the service hasn't been initialized.\
Ensure that the translation files are successfully loaded before calling this method.
{% endhint %}

***

## **`translateObject()`**

The `translateObject()` function allows you to translate an entire object, similarly to the `translate()` function, without needing to inject the service.

```typescript
import { translateObject } from '@jsverse/transloco';

translateObject('some.object');
```

{% hint style="warning" %}
**Requires `provideGlobalTranslateFn()`**\
As of v9 this function is no longer wired up automatically. Add [`provideGlobalTranslateFn()`](#provideglobaltranslatefn) to your root providers, or it returns `[]` and warns in development mode.
{% endhint %}

{% hint style="info" %}
**Important**\
This function is a proxy to the `TranslocoService.translateObject` method. It will not work if the service hasn't been initialized.\
Ensure that the translation files are successfully loaded before calling this method.
{% endhint %}

***

## **`provideGlobalTranslateFn()`**

`provideGlobalTranslateFn()` enables the standalone `translate()` and `translateObject()` functions above. It is required as of v9 — before then, the functions were wired up automatically.

```typescript
import { provideTransloco, provideGlobalTranslateFn } from '@jsverse/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
      },
      loader: TranslocoHttpLoader,
    }),
    provideGlobalTranslateFn(),
  ],
};
```

Both functions resolve against a single Transloco instance, which is what makes them convenient — and what makes them wrong in some setups.

{% hint style="warning" %}
**Omit `provideGlobalTranslateFn()` in SSR and in multi-instance micro-frontend setups.**\
Both run more than one Transloco instance, and a global function has no way to know which one you meant. Inject `TranslocoService` directly there instead.
{% endhint %}

Upgrading from v8? `ng update` adds this provider for you wherever it finds the functions imported. See the [migration guide](../migration-guides/migrate-to-v9.md).

***

## **`getBrowserLang()`**

The `getBrowserLang()` function returns the language code (e.g., `"en"`) detected from the user's browser settings.

```typescript
import { getBrowserLang } from '@jsverse/transloco';

getBrowserLang();
```

***

## **`getBrowserCultureLang()`**

The `getBrowserCultureLang()` function returns the culture language code (e.g., `"en-US"`) detected from the user's browser settings.

```typescript
import { getBrowserCultureLang } from '@jsverse/transloco';

getBrowserCultureLang();
```
