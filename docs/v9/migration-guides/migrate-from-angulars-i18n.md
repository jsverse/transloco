---
icon: a
---

# Migrate from Angular's i18n

## Command

Install the [Transloco CLI](../developer-tools/transloco-cli.md) and run the migration. It rewrites your templates in place, so commit your work first.

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-cli@next --save-dev
pnpm exec transloco migrate angular-i18n --input src/app --langs en es
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-cli@next --dev
yarn transloco migrate angular-i18n --input src/app --langs en es
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-cli@next --save-dev
npx transloco migrate angular-i18n --input src/app --langs en es
```
{% endtab %}
{% endtabs %}

`--input` is the folder holding the templates, `src/app` unless you say otherwise. `--langs` is required and lists the languages to create a translation file for, as separate arguments (`--langs en es`). The files are written to `rootTranslationsPath` of your [config](../developer-tools/global-config.md), or to `src/assets/i18n`. Pass `--translations-path` to write them somewhere else.

### The deprecated schematic

The `ng-migrate` schematic still works until Transloco v10 and logs a deprecation warning. Use `transloco migrate angular-i18n` instead.

{% tabs %}
{% tab title="Angular CLI" %}
```bash
pnpm add @jsverse/transloco-schematics@next
ng g @jsverse/transloco-schematics:ng-migrate
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco-schematics@next
nx g @jsverse/transloco-schematics:ng-migrate
```
{% endtab %}
{% endtabs %}

***

### The Translation File

The migration script will extract all translations from your HTML files and generate a translations JSON file. The script will use the translation string as the key, converting it to kebab case (e.g., "`My sample string`" → "`my-sample-string`"). Here's an example of the output JSON:

{% code title="en.json" %}
```json
{
  "my-sample-string": "My sample string",
  "my-title": "My title"
}
```
{% endcode %}

#### **Example HTML section and matching JSON output**

{% code title="before.html" %}
```html
<h1 i18n>translation value</h1>
<h1 i18n="site header|value 1 sample">Val1</h1>
<h1 i18n="site header|value 2 sample">Val2</h1>
<h1 i18n="other context|another comment@@myId">Val3</h1>
```
{% endcode %}

{% code title="after.json" %}
```json
{
  "translation-value": "translation value",
  "site header": {
    "val1": "Val1",
    "val1.comment": "value 1 sample",
    "val2": "Val2",
    "val2.comment": "value 2 sample"
  },
  "other context": {
    "myId": "Val3",
    "myId.comment": "another comment"
  }
}
```
{% endcode %}

{% hint style="info" %}
_The `.comment` suffix is used to support comments in Transloco.Note:_
{% endhint %}

***

### Directives

The `i18n` and `i18n-<attribute>` directives will be replaced with the `transloco` pipe.

{% code title="before.html" %}
```html
<h1 i18n>Hello World</h1>
<h1 i18n="other context|another comment@@myId">Some value</h1>
<img src="..." i18n i18n-title="Wow image" />
```
{% endcode %}

{% code title="after.html" %}
```html
<h1>{{ 'hello-world' | transloco }}</h1>
<h1>{{ 'some-value' | transloco }}</h1>
<img src="..." title="{{ 'wow-image' | transloco }}" />
```
{% endcode %}
