---
icon: gauge-high
---

# Optimize

{% hint style="warning" %}
**Deprecated in v9:** the `@jsverse/transloco-optimize` package and its `transloco-optimize` bin are replaced by `transloco optimize` of the [Transloco CLI](transloco-cli.md#optimize). The old bin keeps working until Transloco v10, see [Moving to the Transloco CLI](../migration-guides/migrate-to-v9.md#moving-to-the-transloco-cli).
{% endhint %}

The `transloco optimize` command provides the following features:

* AOT translation file flattening
* Removal of translator comments
* JSON file minification

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-cli@next --save-dev
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-cli@next --dev
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-cli@next --save-dev
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
      "command": "transloco optimize {workspaceRoot}/dist/my-app/assets/i18n"
    }
  }
}
```


{% endtab %}

{% tab title="Angular CLI" %}
Add the following script to your `package.json`:

```json
"scripts": {
  "transloco:optimize": "transloco optimize dist/my-app/assets/i18n",
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

If you have a custom pipeline, run the same command as one of its steps. `transloco optimize` exits with code `1` when there is nothing to optimize or a file can't be processed, so a pipeline stops on a failed optimization.

```bash
transloco optimize dist/my-app/assets/i18n --comments-key note
```

{% hint style="info" %}
`ng update` doesn't edit `project.json` files or CI pipelines. If yours still run `transloco-optimize`, change them to `transloco optimize` by hand.
{% endhint %}
