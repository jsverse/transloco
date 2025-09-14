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
**Important**\
This function is a proxy to the `TranslocoService.translate` method. It will not work if the service hasn't been initialized.\
Ensure that the translation files are successfully loaded before calling this method.
{% endhint %}



## **`translateObject()`**

The `translateObject()` function allows you to translate an entire object, similarly to the `translate()` function, without needing to inject the service.

```typescript
import { translateObject } from '@jsverse/transloco';

translateObject('some.object');
```

{% hint style="warning" %}
**Important**\
This function is a proxy to the `TranslocoService.translateObject` method. It will not work if the service hasn't been initialized.\
Ensure that the translation files are successfully loaded before calling this method.
{% endhint %}

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
