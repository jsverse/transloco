# TRANSLOCO MESSAGE FORMAT

Transpiler for `@ngneat/transloco` that uses `messageformat.js` to compile translations using ICU syntax for handling pluralization and gender.

Messageformat is a mechanism for handling both pluralization and gender in your app.

You can see its format guide [here](https://messageformat.github.io/messageformat/page-guide).

## Installation

```
npm i messageformat @ngneat/transloco-messageformat
```

### Usage

The `MessageFormatTranspiler` is compatible with the `DefaultTranspiler` and therefore you can switch without worry that it will break your current translations.

It then enables support for the following within your i18n translation files:

```js
{
  "mySelectRule": "{myVar, select, val1 {Value 1} val2 {Value 2} other {Other Value}}",
  "myPluralRule": "{myCount, plural, =0 {no results} one {1 result} other {# results}}"
}
```

Add the following to the imports array in your `app.module.ts`:

```ts
import { TranslocoMessageFormatModule } from '@ngneat/transloco-messageformat';

...

@NgModule({
  imports: [
    ...,
    TranslocoMessageFormatModule.init()
  ]
})

```

It then enables support for the following within your i18n translation files:

```js
{
  "mySelectRule": "{myVar, select, val1 {Value 1} val2 {Value 2} other {Other Value}}",
  "myPluralRule": "{myCount, plural, =0 {no results} one {1 result} other {# results}}"
}
```

### Locale initialization

By default, messageformat initializes _all_ locales. You could also provide the locales you will need:

```ts
@NgModule({
  imports: [
    ...,
    TranslocoMessageFormatModule.init(
      {
        locales: 'en-GB'
      }
    )
  ]
})
```

The value for `locales` is either a string or an array of strings. The first locale is used as the default locale by messageformat. More info here: https://messageformat.github.io/messageformat/MessageFormat

### Advanced configuration

MessageFormat instances provide some methods to influence its behaviour, among them `addFormatters`, `setBiDiSupport`, and `setStrictNumberSign`. Learn about their meaning here: https://messageformat.github.io/messageformat/MessageFormat

This is how you would enable bi-directional support and add a custom formatter, for example:

```ts

@NgModule({
  imports: [
    ...,
    TranslocoMessageFormatModule.init(
      {
        biDiSupport: true,
        formatters: { upcase: v => v.toUpperCase() }
      }
    )
  ]
})
```
