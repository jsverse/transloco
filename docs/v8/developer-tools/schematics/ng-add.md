# :ng-add

Simplify the setup of Transloco in Angular projects with this schematic. It creates boilerplate translation files and configures Transloco for both module-based and standalone applications. Supports additional features like SSR and custom loaders.

***

## Command

{% tabs %}
{% tab title="Angular CLI" %}
```bash
ng add @jsverse/transloco
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco
nx g @jsverse/transloco:ng-add
```
{% endtab %}
{% endtabs %}

### Features

* Generates translation files for specified languages.
* Configures Transloco for both:
  * **Module-based applications**: Imports `TranslocoRootModule` in the root module
  * **Standalone applications**: Configures `provideTransloco()` in the app config
* Automatically detects Angular 18+ `public/` vs legacy `src/assets/` structure.
* Optional SSR support.
* Customizable translation loader and file paths.

***

### Options

<table data-header-hidden><thead><tr><th width="148"></th><th width="100"></th><th></th><th width="103"></th><th width="100"></th><th data-hidden></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td><td><strong>Additional Details</strong></td></tr><tr><td><code>--langs</code></td><td><code>-</code></td><td>Specifies the languages for which translation files will be created.</td><td><code>string</code></td><td><code>en, es</code></td><td>Example: <code>--langs en,fr,de</code></td></tr><tr><td><code>--loader</code></td><td><code>--lo</code></td><td>Defines the loader used for fetching translation files.</td><td><code>string</code></td><td><code>Http</code></td><td>Options: <code>Http</code>, <code>Webpack</code> Example: <code>--loader Webpack</code></td></tr><tr><td><code>--ssr</code></td><td><code>-</code></td><td>Adds configurations required for projects using Server-Side Rendering (SSR) or prerendering.</td><td><code>boolean</code></td><td><code>false</code></td><td>Example: <code>--ssr</code></td></tr><tr><td><code>--path</code></td><td><code>--p</code></td><td>Specifies a custom location for the generated translation files. When not provided, automatically detects the appropriate folder structure.</td><td><code>string</code></td><td><code>Auto-detected</code></td><td>Auto-detection: <code>public/i18n/</code> (Angular 18+) or <code>src/assets/i18n/</code> (legacy). Override example: <code>--path src/i18n/</code></td></tr><tr><td><code>--project</code></td><td><code>-</code></td><td>Specifies the project where Transloco should be installed.</td><td><code>string</code></td><td>Project root directory name</td><td>Example: <code>--project my-angular-app</code></td></tr><tr><td><code>--module</code></td><td><code>-</code></td><td>Defines the root module where <code>TranslocoModule</code> and related configurations should be imported.</td><td><code>string</code></td><td><code>app</code></td><td>Example: <code>--module app.module.ts</code></td></tr></tbody></table>

### **Usage Example**

```bash
ng add @jsverse/transloco --langs en,fr --loader Webpack --path src/i18n/ --project my-angular-app --module app.module.ts
```
