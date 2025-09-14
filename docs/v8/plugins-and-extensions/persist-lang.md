---
icon: bookmark
---

# Persist Language

This plugin provides the functionality of persisting the active language to the provided storage.

## Installation[​](https://jsverse.github.io/transloco/docs/plugins/persist-lang#installation) <a href="#installation" id="installation"></a>

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-persist-lang
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-persist-lang
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-persist-lang
```
{% endtab %}
{% endtabs %}

## Usage[​](https://jsverse.github.io/transloco/docs/plugins/persist-lang#usage) <a href="#usage" id="usage"></a>

{% tabs %}
{% tab title="Standalone" %}
Add persist lang providers using the into the app's `providers`, and provide the storage you would like to use:

```typescript
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoPersistLang({
      storage: {
        useValue: localStorage,
      },
    }),
  ],
});
```

When the user changes the current language, the plugin will keep it in the provided storage and set it as active when the user returns to the application.

By default, the plugin will use the cached language if available otherwise it will use the default language provided in the config. You can always change this behavior by providing a `getLangFn` option:

```typescript
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

export function getLangFn({
  cachedLang,
  browserLang,
  cultureLang,
  defaultLang,
}) {
  return yourLogic;
}

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoPersistLang({
      getLangFn,
      storage: {
        useValue: localStorage,
      },
    }),
  ],
});
```

The plugin also provides a `cookiesStorage` function that you can use to save the language in a cookie. (SSR advantage)

```typescript
import { provideTranslocoPersistLang, cookiesStorage } from '@jsverse/transloco-persist-lang';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoPersistLang({
      storage: {
        useValue: cookiesStorage(),
      },
    }),
  ],
});
```
{% endtab %}

{% tab title="NgModule" %}
Add persist lang providers using the into the `TranslocoRootModule`, and provide the storage you would like to use:

{% code title="transloco-root.module.ts" %}
```typescript
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

@NgModule({
  providers: [
    provideTranslocoPersistLang({
      storage: {
        useValue: localStorage,
      },
    }),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}

When the user changes the current language, the plugin will keep it in the provided storage and set it as active when the user returns to the application.

By default, the plugin will use the cached language if available otherwise it will use the default language provided in the config. You can always change this behavior by providing a `getLangFn` option:

{% code title="transloco-root.module.ts" %}
```typescript
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';

export function getLangFn({
  cachedLang,
  browserLang,
  cultureLang,
  defaultLang,
}) {
  return yourLogic;
}

@NgModule({
  providers: [
    provideTranslocoPersistLang({
      getLangFn,
      storage: {
        useValue: localStorage,
      },
    }),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}

The plugin also provides a `cookiesStorage` function that you can use to save the language in a cookie. (SSR advantage)

{% code title="transloco-root.module.ts" %}
```typescript
import { provideTranslocoPersistLang, cookiesStorage } from '@jsverse/transloco-persist-lang';

@NgModule({
  imports: [
    provideTranslocoPersistLang({
      storage: {
        useValue: cookiesStorage(),
      },
    }),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

