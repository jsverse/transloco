---
icon: shield-check
---

# Intl Message Format

The **@jsverse/transloco-intlmessageformat** package integrates Transloco with FormatJS **intl-messageformat**, enabling ICU syntax for pluralization, gender and number, date and time formatting in your app's translations.

It covers the same ground as the [Message Format](message-format.md) plugin, with one difference in how a message is turned into text: `intl-messageformat` interprets the parsed message, where `@messageformat/core` compiles it to a function with `new Function`. That makes this plugin usable under a Content Security Policy that does not allow `unsafe-eval`.

For a detailed guide on the syntax, refer to the [FormatJS message syntax guide](https://formatjs.github.io/docs/core-concepts/icu-syntax).

***

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-intlmessageformat@next
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-intlmessageformat@next
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-intlmessageformat@next
```
{% endtab %}
{% endtabs %}

## Usage

The `IntlMessageFormatTranspiler` is fully compatible with Transloco's default transpiler, so you can safely switch without impacting your existing translations. With this plugin, you can use ICU syntax in your translation files:

{% code title="en.json" %}
```json
{
  "mySelectRule": "{myVar, select, val1 {Value 1} val2 {Value 2} other {Other Value}}",
  "myPluralRule": "{myCount, plural, =0 {no results} one {1 result} other {# results}}"
}
```
{% endcode %}

{% tabs %}
{% tab title="Standalone" %}
To enable the plugin, include the following provider in your app providers:

{% code overflow="wrap" %}
```typescript
import { provideTranslocoIntlMessageFormat } from '@jsverse/transloco-intlmessageformat';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoIntlMessageFormat(),
  ],
});
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
To enable the plugin, include the following provider in your `TranslocoRootModule`:

{% code title="transloco-root.module.ts" overflow="wrap" %}
```typescript
import { provideTranslocoIntlMessageFormat } from '@jsverse/transloco-intlmessageformat';

@NgModule({
  providers: [
    provideTranslocoIntlMessageFormat(),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

## Locale

The locale decides which plural rules apply and how numbers, dates and times are formatted. The transpiler follows the active language: every language change sets the locale to the new language.

Until the first language change, the locale is the one you pass in `locales`, or the default locale of the runtime when you pass none:

{% tabs %}
{% tab title="Standalone" %}
{% code overflow="wrap" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoIntlMessageFormat({
      locales: 'en-GB', // or ['en-GB', 'fr']
    }),
  ],
});
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
{% code title="transloco-root.module.ts" %}
```typescript
@NgModule({
  providers: [
    provideTranslocoIntlMessageFormat({
      locales: 'en-GB', // or ['en-GB', 'fr']
    }),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

**`locales`**: Accepts a string or an array of strings, as the `Intl` APIs do.

***

## Advanced Configuration

* **`formats`**: Named `number`, `date` and `time` formats that a message can refer to.
* **`opts`**: Options passed to the `IntlMessageFormat` constructor, see the [intl-messageformat API](https://formatjs.github.io/docs/intl-messageformat).

Example configuration with a named number format:

{% tabs %}
{% tab title="Standalone" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoIntlMessageFormat({
      formats: {
        number: {
          percentage: { style: 'percent' },
        },
      },
    }),
  ],
});
```
{% endtab %}

{% tab title="NgModule" %}
{% code title="transloco-root.module.ts" %}
```typescript
@NgModule({
  providers: [
    provideTranslocoIntlMessageFormat({
      formats: {
        number: {
          percentage: { style: 'percent' },
        },
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

{% code title="en.json" %}
```json
{
  "progress": "Progress: {done, number, percentage}"
}
```
{% endcode %}

### HTML in translations

`intl-messageformat` can treat a tag such as `<b>` as a placeholder that you fill with a function. Translations often carry plain HTML, so the plugin sets `ignoreTag` to `true` by default: tags are kept as text.

To use FormatJS rich text formatting, turn it off and pass a function per tag:

```typescript
provideTranslocoIntlMessageFormat({
  opts: { ignoreTag: false },
});
```

{% code title="en.json" %}
```json
{
  "welcome": "Hello <b>{name}</b>"
}
```
{% endcode %}

```typescript
translocoService.translate('welcome', {
  name: 'Transloco',
  b: (chunks: string[]) => `<strong>${chunks.join('')}</strong>`,
});
```

## Caching

A parsed message is cached by default, so a translation is parsed once per locale and only formatted on the next calls. If you wish to disable caching, you can set the `enableCache` option to `false`:

{% tabs %}
{% tab title="Standalone" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoIntlMessageFormat({
      enableCache: false,
    }),
  ],
});
```
{% endtab %}

{% tab title="NgModule" %}
{% code title="transloco-root.module.ts" %}
```typescript
@NgModule({
  providers: [
    provideTranslocoIntlMessageFormat({
      enableCache: false,
    }),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

***

## Differences from Message Format

The two plugins share the ICU syntax, so most translation files work with either. Keep these differences in mind when you switch:

* **Custom formatters**: `customFormatters` has no counterpart. Use named `formats` for number, date and time formatting.
* **Unknown plural categories**: A plural category that does not exist in the active locale, such as `few` in English, is ignored. Message Format throws on it.
* **Missing params**: Formatting a message without a param it refers to throws an error. Message Format renders `undefined` in its place.
* **HTML**: Tags are kept as text unless you set `opts.ignoreTag` to `false`.
