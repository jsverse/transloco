# Scoped Library Extractor

In some cases, you may need to include translations within your npm libraries, especially in a monorepo environment. This allows you to keep translation files inside the library's folder and package them together. However, loading translation files directly from the library can be challenging for two main reasons:

1. The application’s public directory isn't directly accessible.
2. Webpack dynamic imports don’t work with libraries.

To overcome these issues, the only option is to load the translation files from the application's public folder. This means you would need to manually copy the translation files from the library to the application's translation folder, which can be repetitive and error-prone.

This is where the **Scoped Library Extractor** tool comes in, which automates this process for you.

## Example Setup

Let's consider a monorepo with the following structure:

```
📦 projects
 ┣ 📂 core
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 lib
 ┃ ┃ ┃ ┣ core.component.ts
 ┃ ┃ ┃ ┣ core.module.ts
 ┃ ┃ ┃ ┣ 📂 i18n
 ┃ ┃ ┃ ┃ ┣ en.json
 ┃ ┃ ┃ ┃ ┗ es.json
 ┃ ┃ ┣ public-api.ts
 ┣ ng-package.json
 ┣ package.json
📦 src
 ┣ 📂 app
 ┃ ┣ app.component.html
 ┃ ┣ app.component.ts
 ┃ ┣ app.module.ts
 ┃ ┗ transloco.loader.ts
 ┣ 📂 assets
 ┃ ┣ 📂 i18n
 ┃ ┃ ┣ en.json
 ┃ ┃ ┗ es.json

```

Here, we have a **core** library with its own translation files located under `projects/core/src/lib/i18n`. To use these translations in our application, we need to configure the library’s translations in the `CoreModule`.

{% stepper %}
{% step %}
### Declare the Translation Scope

In the `CoreModule`, provide the scope for the translations:

{% code title="core.module.ts" %}
```typescript
import { provideTranslocoScope } from './transloco.providers';

@NgModule({
  declarations: [CoreComponent],
  providers: [provideTranslocoScope('core')],
  imports: [TranslocoModule],
})
export class CoreModule {}
```
{% endcode %}

Then, in the `CoreComponent`, use the translations with the defined scope:

{% code title="lib-core.component.html" %}
```html
<ng-container *transloco="let t">
  {{ t('core.title') }}
</ng-container>
```
{% endcode %}
{% endstep %}

{% step %}
### Install the Scoped Library Extractor

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-scoped-libs --save-dev
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-scoped-libs --dev
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-scoped-libs --save-dev
```
{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}
### Configure the Library's `package.json`

In the `core` library’s `package.json`, add an `i18n` configuration that specifies the scope and translation path:

{% code title="projects/core/package.json" %}
```json
{
  "name": "@app/core",
  "i18n": [
    {
      "scope": "core",
      "path": "src/lib/i18n"
    }
  ]
}
```
{% endcode %}
{% endstep %}

{% step %}
### Configure the Global Transloco Config

In your global `transloco.config.ts`, add the path to the library in the `scopedLibs` configuration:

{% code title="transloco.config.ts" %}
```typescript
const config: TranslocoGlobalConfig = {
    scopedLibs: ['./projects/core/', '@lib/name']
};
```
{% endcode %}

If you need to specify multiple destinations for the extracted files, you can also use an object configuration:

{% code title="transloco.config.ts" %}
```typescript
const config: TranslocoGlobalConfig = {
  scopedLibs: [
    {
      src: './projects/core',
      dist: ['./projects/spa/src/assets/i18n', './src/assets/i18n/']
    }
  ]
};
```
{% endcode %}
{% endstep %}

{% step %}
### Add the Extractor Script

Finally, add a script to the main `package.json` to run the extractor, you  can also enable "watch mode" by adding the `--watch` flag:

{% code title="package.json" %}
```json
"scripts": {
  "transloco:extract-scoped-libs": "transloco-scoped-libs --watch"
}
```
{% endcode %}
{% endstep %}

{% step %}
### Run the Script

Now, run the script to extract the translation files from the library and copy them to the main project's translation folder:

```bash
pnpm transloco:extract-scoped-libs
```

This script will:

* Extract the translation files from the library.
* Copy them to the main project's `src/assets/i18n` folder.
* Add the library’s translation files to `.gitignore` (use the `--skip-gitignore` flag if you want to skip this step).
{% endstep %}
{% endstepper %}

## Join Strategies

The tool supports two strategies for handling translations:

1. **Default Strategy**: The translation files from the library will be copied individually into the main project's translation folder.
2. **Join Strategy**: All translation files from the library will be combined into a single file (e.g., `en.vendor.json`), which can then be loaded alongside the main translation files.

To use the **Join Strategy**, modify the `package.json` of the library:

{% code title="projects/core/package.json" %}
```json
{
  "name": "@app/core",
  "i18n": [
    {
      "scope": "core",
      "path": "src/lib/i18n",
      "strategy": "join"
    }
  ]
}
```
{% endcode %}

Then, in your application loader, you can use the following setup to load both the main and vendor translations:

```typescript
// transloco-loader.ts
@Injectable({ providedIn: 'root' })
export class HttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string, { scope }) {
    const base = this.http.get(`/assets/i18n/${lang}.json`);

    if (scope) {
      return base;
    }

    return forkJoin([
      base,
      this.http.get(`/assets/i18n/${lang}.vendor.json`),
    ]).pipe(
      map(([translation, vendor]) => {
        return { ...translation, ...vendor };
      }),
    );
  }
}

export const httpLoader = { provide: TRANSLOCO_LOADER, useClass: HttpLoader };
```

## Use with Webpack

To add custom Webpack support, use a tool like `ngx-build-plus` and include the plugin in your `webpack.config.js`:

```javascript
const TranslocoScopedLibsWebpackPlugin = require('@jsverse/transloco-scoped-libs/webpack');

module.exports = {
  plugins: [new TranslocoScopedLibsWebpackPlugin()],
};
```

This solution ensures that translation files from libraries are easily extracted, joined, and integrated into your application.
