Transpiler for `@ngneat/transloco` that uses `messageformat.js` to compile translations using ICU syntax for handling pluralization and gender.

Messageformat is a mechanism for handling both pluralization and gender in your app.

You can see its format guide [here](https://messageformat.github.io/messageformat/page-guide).

## Installation

```
npm i messageformat @ngneat/transloco-messageformat
```

Then add the following to the providers array in your `app.module.ts`:

```ts
import { MessageFormatTranspiler } from '@ngneat/transloco-messageformat';

...

@NgModule({
  providers: [
    ...,
    { provide: TRANSLOCO_TRANSPILER, useClass: MessageFormatTranspiler }
  ]
})

```

The `MessageFormatTranspiler` is compatible with the `DefaultTranspiler` and therefore you can switch without worry that it will break your current translations.

It then enables support for the following within your i18n translation files:

```js
{
  "mySelectRule": "{myVar, select, val1 {Value 1} val2 {Value 2} other {Other Value}}",
  "myPluralRule": "{myCount, plural, =0 {no results} one {1 result} other {# results}}"
}
```
