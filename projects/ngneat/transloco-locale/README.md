# Transloco Locale L10N

This plugin provides localization(l10n) support for Transloco.

> Localization refers to the adaptation of a product, application or document content to meet the language, cultural and other requirements of a specific target market (a locale).

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Configuration](#configuration-options)
- [Setting Locale](#setting-locale)
  - [Locale Translation Files](#translation-files-name)
  - [Language Locale Mapping](#language-locale-mapping)
  - [Manually Setting Locale](#manually-setting-locale)
- [Service API](#service-api)
- [Localization Pipes](#localization-pipes)
  - [Date](#date-pipe)
  - [Currency](#currency-pipe)
  - [Decimal](#decimal-pipe)
  - [Percent](#percent-pipe)
  - [Browser Support](#browser-support)

## Installation

```
npm i @ngneat/transloco-locale
```

### Setup

Inject `TranslocoLocaleModule` along with `TranslocoModule` into `AppModule`:

```typescript
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';

@NgModule({
  imports: [TranslocoModule, TranslocoPersistLangModule.init()],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Configuration Options

Let's go over each one of the `config` options:

- `localeConfig?`: Declare the default configuration of the locale's formatting. A general configuration could be set using the `global` property, for a configuration by locale use `localeBased` property (default value determine by the native [javascript's api](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)).
- `defaultLocale?`: The default locale formatted in [BCP 47](https://tools.ietf.org/html/bcp47) (default value: `en-US`),
- `langToLocaleMapping?`: A key value `object` that maps Transloco language to it's Locale (default value: `{}`).
- `localeToCurrencyMapping?`: A key value `object` that maps the Locale to it's currency (the library provide a default value with all of the existing mapping).

### Setting Locale

The library provides 3 different ways to set the locale.

##### Translation files name:

Using locale format for the translation files will automatically declare the locale on `langChanges$` event:

```
├─ i18n/
   ├─ en-US.json
   ├─ en-GB.json
   ├─ es-ES.json
```

##### Language Locale Mapping:

Users who don't have more then 1 locale per language
could provide a language locale mapping object using the config's `langToLocaleMapping`:

```typescript
@NgModule({
  imports: [
    TranslocoPersistLangModule.init({
      langToLocaleMapping: {
        en: 'en-US',
        es: 'es-ES'
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

##### Manually Setting Locale:

The third option in manually setting the locale, this could be done by calling `setLocale` method from `localeSerice`:

```typescript
export class AppComponent {
  constructor(private service: TranslocoLocaleService) {}

  ngOnInit() {
    this.service.setLocale('en-US');
  }
}
```

### Service API

- `localeChanges$` - Observable of the active locale.
- `getLocale` - Gets the active locale.
- `setLocale` - Sets the active locale.

### Localization Pipes

The library provides localization pipes base on the native [javascript's api](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl).

#### Date Pipe

Transform a date into the locale's date format.

The date expression: a `Date` object, a number
(milliseconds since UTC epoch), or an [ISO string](https://www.w3.org/TR/NOTE-datetime).

```html
<!--9/10/2019-->
<span> {{ date | translocoDate }} </span>
<!-- Sep 10, 2019, 10:46:12 PM-->
<span>
  {{ date | translocoDate: { dateStyle: 'medium', timeStyle: 'medium' }}
</span>
<!-- 7:40:32 PM Coordinated-->
<span>
  {{ date | translocoDate: { timeZone: 'UTC',d timeStyle: 'full' } }}
</span>
<!-- Jan 1, 1970-->
<span>
  {{ 1 | translocoDate: { dateStyle: 'medium' } }}
</span>
<!-- Feb 8, 2019-->
<span>
  {{ '2019-02-08' | translocoDate: { dateStyle: 'medium' } }}
</span>
```

#### Currency Pipe

Transform a given number into the locale's currency format.

```html
<!--$1,000,000.00-->
<span> {{ 1000000 | translocoCurrency }} </span>
<!--1,000,000.00 US dollars-->
<span>
  {{ 1000000 | translocoCurrency: 'name' }}
</span>
<!--$1,000,000-->
<span>
  {{ 1000000 | translocoCurrency: 'symbol' : { minimumFractionDigits: 0 } }}
</span>
```

#### Decimal Pipe

Transform a given number into the locale's currency format.

```html
<!--1,234,567,890-->
<span>
  {{ 1234567890 | translocoDecimal }}
</span>
<!--1234567890-->
<span>
  {{ 1234567890 | translocoDecimal: {useGrouping: false} }}
</span>
```

#### Percent Pipe

Transform a given number into the locale's currency format.

```html
<!--100%-->
<span> 1 | translocoPercent </span>
<!--100%-->
<span> "1" | translocoPercent </span>
```

#### Browser Support

<img src="./browser-support.jpeg" />
