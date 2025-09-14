---
icon: bookmark
---

# Persist Translations

The **@jsverse/transloco-persist-translations** plugin provides functionality to cache translations in specified storage. This ensures translations are stored locally and reduces the need for repeated network requests.

***

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-persist-translations
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-persist-translations
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-persist-translations
```
{% endtab %}
{% endtabs %}

## Usage

To enable persistent translations, provide the necessary configuration in your application's Transloco module or config file. Specify the loader and the storage you want to use.

### **LocalStorage Example**

{% tabs %}
{% tab title="Standalone" %}
To enable the plugin, include the following provider in your app providers:

{% code overflow="wrap" %}
```typescript
import { provideTranslocoPersistTranslations } from '@jsverse/transloco-persist-translations ';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoPersistTranslations({
      loader: TranslocoHttpLoader, // Auto-generated via ng add
      storage: { useValue: localStorage },
    }),
  ],
});
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
To enable the plugin, include the following provider in your `TranslocoRootModule`:

{% code title="transloco-root.module.ts" %}
```typescript
import { provideTranslocoPersistTranslations } from '@jsverse/transloco-persist-translations';
import { TranslocoHttpLoader } from './transloco-loader';

@NgModule({
  providers: [
    provideTranslocoPersistTranslations({
      loader: TranslocoHttpLoader, // Auto-generated via ng add
      storage: { useValue: localStorage },
    }),
  ],
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Ensure you do **not** include the default loader when using this plugin.
{% endhint %}

### **Async Storage (IndexedDB) Example**

You can use asynchronous storage like **IndexedDB** with the help of libraries such as `localForage`:

{% tabs %}
{% tab title="Standalone" %}
```typescript
import { provideTranslocoPersistTranslations } from '@jsverse/transloco-persist-translations ';
import * as localForage from 'localforage';

localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'Transloco',
  storeName: 'translations',
});

bootstrapApplication(AppComponent, {
  providers: [
   provideTranslocoPersistTranslations({
      loader: TranslocoHttpLoader, // Auto-generated via ng add
      storage: { useValue: localForage },
    }),
  ],
});
```
{% endtab %}

{% tab title="NgModule" %}
{% code title="transloco-root.module.ts" %}
```typescript
import { provideTranslocoPersistTranslations } from '@jsverse/transloco-persist-translations';
import * as localForage from 'localforage';

localForage.config({
  driver: localForage.INDEXEDDB,
  name: 'Transloco',
  storeName: 'translations',
});

@NgModule({
  providers: [
    provideTranslocoPersistTranslations({
      loader: TranslocoHttpLoader, // Auto-generated via ng add
      storage: { useValue: localForage },
    }),
  ],
})
export class TranslocoRootModule {}
```
{% endcode %}


{% endtab %}
{% endtabs %}

***

## Configuration Options

The `provideTranslocoPersistTranslations` method supports the following configuration options:

<table><thead><tr><th width="190">Option</th><th width="135">Type</th><th>Description</th></tr></thead><tbody><tr><td><strong><code>ttl</code></strong></td><td><code>number</code></td><td>Time-to-live for the cache (in seconds).</td></tr><tr><td><strong><code>storageKey</code></strong></td><td><code>string</code></td><td>Key to store translation data.</td></tr></tbody></table>

### **Example:**

```typescript
provideTranslocoPersistTranslations({
  loader: TranslocoHttpLoader,
  storage: { useValue: localStorage },
  ttl: 86_400, // Cache duration in seconds (1 day)
  storageKey: 'custom-translations-key',
});
```

***

## Clearing the Cache

The cache is automatically cleared when the **`ttl`** expires. However, you can manually clear it using the `clearCache` method:

{% code title="app.component.ts" %}
```typescript
import { TranslocoPersistTranslations } from '@jsverse/transloco-persist-translations';

export class AppComponent {
  #translationsCache = inject(TranslocoPersistTranslations);

  clearTranslationsCache() {
    this.#translationsCache.clearCache();
  }
}
```
{% endcode %}

***

With this plugin, you can optimize your app's translation loading process, reduce network requests, and provide a seamless multilingual experience for your users.
