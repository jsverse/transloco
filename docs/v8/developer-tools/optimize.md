---
icon: gauge-high
---

# Optimize

This library provides the following features:

* AOT translation file flattening
* Removal of translator comments
* JSON file minification

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-optimize --save-dev
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-optimize --dev
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-optimize --save-dev
```
{% endtab %}
{% endtabs %}

## Usage

1. Make the optimizer run after building

{% tabs %}
{% tab title="Nx" %}
Create the following task in your `project.json` configuration file:

```json
{
  "name": "my-app", 
  ...,
  "targets": {
    "transloco:optimize": {
      "command": "transloco-optimize {workspaceRoot}/dist/my-app/assets/i18n"
    }
  }
}
```


{% endtab %}

{% tab title="Angular CLI" %}
Add the following script to your `package.json`:

```json
"scripts": {
  "transloco:optimize": "transloco-optimize dist/my-app/assets/i18n",
  "build:prod": "ng build --prod && npm run transloco:optimize"
}
```
{% endtab %}
{% endtabs %}

2. In your Transloco configuration, add the following setting:

<pre class="language-typescript"><code class="lang-typescript">provideTransloco({
  config: {
    flatten: {
<strong>      aot: !isDevMode()
</strong>    }
    ...
  },
}),
</code></pre>

Alternatively, if you have some custom pipeline, you can just import it as a function:

```typescript
import translocoOptimize from '@jsverse/transloco-optimize';

// e.g: `${__dirname}/dist/${appName}/assets/i18n`;
const pathToLocales = ...
await translocoOptimize({ dist: pathToLocales });
```
