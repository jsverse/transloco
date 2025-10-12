---
icon: brackets-curly
---

# Message Format

The **@jsverse/transloco-messageformat** package integrates Transloco with **@messageformat/core**, enabling the compilation of translations using ICU syntax. This allows for advanced handling of pluralization and gender in your app's translations.

MessageFormat provides a robust mechanism for handling linguistic rules, making your app's translations more dynamic and user-friendly. For a detailed guide on its syntax, refer to [MessageFormat's format guide](https://messageformat.github.io/).

***

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-messageformat
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-messageformat
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-messageformat
```
{% endtab %}
{% endtabs %}

## Usage

The `MessageFormatTranspiler` is fully compatible with Transloco's default transpiler, so you can safely switch without impacting your existing translations. With this plugin, you can use ICU syntax in your translation files:

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
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoMessageformat(),
  ],
});
```
{% endcode %}
{% endtab %}

{% tab title="NgModule" %}
To enable the plugin, include the following provider in your `TranslocoRootModule`:

{% code title="transloco-root.module.ts" overflow="wrap" %}
```typescript
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

@NgModule({
  providers: [
    provideTranslocoMessageformat(),
  ],
  ...
})
export class TranslocoRootModule {}
```
{% endcode %}
{% endtab %}
{% endtabs %}

## Locale Initialization

By default, MessageFormat initializes all locales. You can customize this by specifying the locales you need:

{% tabs %}
{% tab title="Standalone" %}
{% code overflow="wrap" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoMessageformat({
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
    provideTranslocoMessageformat({
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

**`locales`**: Accepts a string or an array of strings. The first locale is used as the default by MessageFormat.\
For more details, refer to [MessageFormat locales](https://messageformat.github.io/messageformat/#/locales).

***

## Advanced Configuration

MessageFormat provides additional options, such as:

* **`customFormatters`**: Add custom formatting functions.
* **`biDiSupport`**: Enable bidirectional support for right-to-left languages.
* **`strictNumberSign`**: Strictly interpret `#` in plural rules.

Example configuration with advanced options:

{% tabs %}
{% tab title="Standalone" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoMessageformat({
      biDiSupport: true,
      customFormatters: {
        upcase: (v: string) => v.toUpperCase(),
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
    provideTranslocoMessageformat({
      biDiSupport: true,
      customFormatters: {
        upcase: (v: string) => v.toUpperCase(),
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

## Caching

The compiled output of MessageFormat is cached by default to improve performance. If you wish to disable caching, you can set the `enableCache` option to `false`:

{% tabs %}
{% tab title="Standalone" %}
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTranslocoMessageformat({
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
    provideTranslocoMessageformat({
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

This integration empowers you to use ICU syntax for advanced pluralization, gender, and linguistic rules, making your translations more accurate and expressive.
