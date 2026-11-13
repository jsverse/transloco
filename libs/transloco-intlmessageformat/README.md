# Transloco IntlMessageFormat

An ICU transpiler for Transloco built on [FormatJS `intl-messageformat`](https://formatjs.github.io/docs/intl-messageformat/).

Unlike `@jsverse/transloco-messageformat`, it interprets the parsed message instead of compiling it with `new Function`, so it works under a Content Security Policy that does not allow `unsafe-eval`.

## Installation

```bash
npm install @jsverse/transloco-intlmessageformat
```

## Usage

```ts
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoIntlMessageFormat } from '@jsverse/transloco-intlmessageformat';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({ ... }),
    provideTranslocoIntlMessageFormat(),
  ],
};
```

## Configuration

```ts
provideTranslocoIntlMessageFormat({
  locales: 'en-GB',
  formats: { number: { compact: { notation: 'compact' } } },
  opts: { ignoreTag: false },
  enableCache: true,
});
```

| Option        | Default         | Description                                                                |
| ------------- | --------------- | -------------------------------------------------------------------------- |
| `locales`     | active language | Locale(s) used for plural rules and number/date formatting                 |
| `formats`     | -               | Custom named `number`, `date` and `time` formats                           |
| `opts`        | -               | Options passed to `IntlMessageFormat`                                      |
| `enableCache` | `true`          | Reuse the parsed message for every translation with the same source string |

## Differences from `@jsverse/transloco-messageformat`

- Custom formatters (`customFormatters`) are not supported, use `formats` instead.
- A plural category that does not exist in the active locale is ignored instead of throwing.
- `ignoreTag` defaults to `true`, so HTML in a translation is kept as text. Set `opts.ignoreTag` to `false` to use FormatJS rich text formatting.
