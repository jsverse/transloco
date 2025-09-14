---
icon: bolt
---

# Quickstart

{% hint style="info" %}
💡 Tip

If you already have i18n implemented in your project and are considering migrating to Transloco, check out our [Migration Guides](broken-reference).
{% endhint %}

The recommended way to add Transloco to your project is by running the add schematics:

{% tabs %}
{% tab title="Angular CLI" %}
```bash
ng add @jsverse/transloco
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco
# Standalone
nx g @jsverse/transloco:ng-add
# Integrated monorepo workspace
nx g @jsverse/transloco:ng-add --project=my-app


```
{% endtab %}
{% endtabs %}

For more information, see the [ng-add](../developer-tools/schematics/ng-add.md) documentation page.

As part of the installation process, you'll be presented with questions; Once you answer them, everything you need will automatically be created.&#x20;

{% hint style="info" %}
If you prefer not to use the schematics, you can install Transloco and manually add the files described below
{% endhint %}

Let's take a closer look at the updates made and the generated files:

{% tabs %}
{% tab title="Standalone" %}
The command will add the `provideTransloco` and `provideHttpClient` to your app providers:

{% code title="app.config.ts" overflow="wrap" %}
```typescript
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';

import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
When added to a module-based application a new `transloco-root.module.ts` which exposes an Angular module with a default configuration, and injects it into the `AppModule`:

```typescript
import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { Injectable, isDevMode, NgModule } from '@angular/core';

import { TranslocoHttpLoader } from './transloco-loader';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
})
export class TranslocoRootModule {}
```

{% hint style="info" %}
You should import the `TranslocoRootModule` once in your root module, and use `TranslocoModule` in any other module.
{% endhint %}
{% endtab %}
{% endtabs %}

### **Transloco loader**[**​**](https://jsverse.github.io/transloco/docs/getting-started/installation?app-type=ng-module#transloco-loader)

A default http loader implementation to fetch the translation files:

```typescript
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
```

{% hint style="info" %}
When you deploy your application and Transloco is unable to load your language files it might be because you need to use a relative path:

```typescript
getTranslation(langPath: string) {
  return this.http.get(`./assets/i18n/${langPath}.json`);
}
```
{% endhint %}

### **Translation JSON files**[**​**](https://jsverse.github.io/transloco/docs/getting-started/installation?app-type=ng-module#translation-json-files)

Transloco creates boilerplate files for the requested languages with an empty JSON:

{% code title="assets/i18n/en.json" %}
```json
{}
```
{% endcode %}

### **Transloco Global Config**[**​**](https://jsverse.github.io/transloco/docs/getting-started/installation?app-type=ng-module#transloco-global-config)

This config is used by tools & plugins such as the scoped lib extractor and the keys manager.

{% code title="transloco.config.ts" %}
```typescript
import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'src/assets/i18n/',
  langs: ['en', 'es'],
  keysManager: {},
};

export default config;
```
{% endcode %}

And that's it! Now we are ready to use it in our project.
