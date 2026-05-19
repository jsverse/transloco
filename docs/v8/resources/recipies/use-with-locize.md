# Use with Locize

[Locize](https://www.locize.com/?from=transloco-docs) is a translation
management system built by the same team behind
[i18next](https://www.i18next.com). It hosts your translation files on a
CDN and ships an editor, review workflow, AI translation, and a
`saveMissing` flow. This recipe wires Transloco to Locize via a custom
`TranslocoLoader` (for reads) and a custom `TranslocoMissingHandler`
(for `saveMissing`-style writes) — no Locize-specific plugin needed.

{% stepper %}
{% step %}
### Install the `locizer` client

[`locizer`](https://github.com/locize/locizer) is the lightweight
framework-agnostic client for the Locize CDN. Transloco itself does the
reads via `HttpClient`; `locizer` is only used here for the optional
saveMissing flow.

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add locizer
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add locizer
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install locizer
```
{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}
### Implement a `TranslocoLoader` against the Locize CDN

Locize serves translations at
`https://{host}/{projectId}/{version}/{lang}/{namespace}` — pick the
host according to your project's CDN type (see the
[CDN endpoint](#locize-cdn-endpoint) section below).

{% tabs %}
{% tab title="Standalone" %}
```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

const projectId = '<your locize project id>';
const version = 'latest';
const namespace = 'translation';
// Standard CDN (default for new projects): 'https://api.lite.locize.app'
// Pro CDN:                                  'https://api.locize.app'
const locizeHost = 'https://api.lite.locize.app';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(
      `${locizeHost}/${projectId}/${version}/${lang}/${namespace}`,
    );
  }
}
```
{% endtab %}

{% tab title="NgModule" %}
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

const projectId = '<your locize project id>';
const version = 'latest';
const namespace = 'translation';
const locizeHost = 'https://api.lite.locize.app'; // or 'https://api.locize.app' for Pro CDN

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<Translation>(
      `${locizeHost}/${projectId}/${version}/${lang}/${namespace}`,
    );
  }
}
```
{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}
### Implement a `TranslocoMissingHandler` that pushes new keys to Locize

When a key is requested in the active language **and** the active
language equals the default (reference) language, push the key to
Locize so translators can fill it in. `locizer.init` is called once
from the handler's constructor (after Angular bootstrap) and the
apiKey is gated on `isDevMode()` so production builds never carry the
write-enabled credential.

{% hint style="warning" %}
**Never commit a Locize write apiKey to your repository.** Even with
the `isDevMode()` guard, a hardcoded string literal still ends up in
the dev bundle and (worse) in source control. Source it from a
git-ignored env file (`.env.development`, `environment.ts` excluded
from VCS, or a runtime config endpoint) and read it via your build
tool's env-var injection (e.g. `import.meta.env.VITE_LOCIZE_APIKEY`
for Vite-based builds, or a build-replaced constant).
{% endhint %}

```typescript
import { Injectable, isDevMode } from '@angular/core';
import {
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
} from '@jsverse/transloco';
import locizer from 'locizer';

const projectId = '<your locize project id>';
const namespace = 'translation';

// Sourced from a git-ignored env file, not hardcoded.
const devApiKey = import.meta.env.VITE_LOCIZE_APIKEY as string | undefined;

@Injectable({ providedIn: 'root' })
export class LocizeMissingTranslationHandler implements TranslocoMissingHandler {
  constructor() {
    // Init once after Angular bootstrap so isDevMode() is reliable.
    locizer.init({
      projectId,
      apiKey: isDevMode() ? devApiKey : undefined,
      version: 'latest',
      cdnType: 'standard', // or 'pro'
    });
  }

  handle(key: string, data: TranslocoMissingHandlerData): string {
    if (data.activeLang === data.defaultLang) {
      locizer.add(namespace, key, key);
    }
    return key;
  }
}
```
{% endstep %}

{% step %}
### Wire both into `app.config.ts`

{% tabs %}
{% tab title="Standalone" %}
```typescript
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
} from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-http-loader';
import { LocizeMissingTranslationHandler } from './transloco-missing-translation-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'de'],
        defaultLang: 'en',
        fallbackLang: 'de',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMissingHandler(LocizeMissingTranslationHandler),
  ],
};
```
{% endtab %}

{% tab title="NgModule" %}
```typescript
import { NgModule, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
  TranslocoModule,
} from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-http-loader';
import { LocizeMissingTranslationHandler } from './transloco-missing-translation-handler';

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'de'],
        defaultLang: 'en',
        fallbackLang: 'de',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMissingHandler(LocizeMissingTranslationHandler),
  ],
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}
{% endstep %}
{% endstepper %}

## Locize CDN endpoint

Locize ships two CDN infrastructures (full comparison at
[CDN types: Standard vs. Pro](https://www.locize.com/docs/integration/cdn-types-standard-vs-pro?from=transloco-docs)):

* **Standard CDN** at `api.lite.locize.app` — BunnyCDN-backed, free for
  generous monthly download volumes, 1-hour fixed cache, public-only.
  Default for newly created Locize projects.
* **Pro CDN** at `api.locize.app` — CloudFront-backed, paid, supports
  private downloads, custom cache control, and published-namespace
  backups.

Pick the host that matches your project's CDN type. Both serve the same
URL shape.

## Full example

A complete Angular 21 + `@jsverse/transloco` 8 app using this pattern
lives at
[github.com/locize/transloco-example](https://github.com/locize/transloco-example).
For the API reference and full URL shapes (auth, query options,
caching), see the
[Locize API docs](https://www.locize.com/docs/integration/api?from=transloco-docs).
