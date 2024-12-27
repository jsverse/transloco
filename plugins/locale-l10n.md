# Locale l10n

This plugin adds localization (l10n) support to Transloco, enabling applications to adapt content to meet the language, cultural, and other requirements of specific locales.

***

## **Installation**

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-locale
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-locale
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-locale
```
{% endtab %}
{% endtabs %}

## **Setup**

{% tabs %}
{% tab title="Standalone" %}
Add locale providers to your app configuration:

{% code title="app.config.ts" %}
```typescript
export const appConfig = {
  providers: [
    provideTranslocoLocale(),
    ...
  ],
};
```
{% endcode %}

Import the `TranslocoLocaleModule` or the specific directive/pipe you need into your standalone component.
{% endtab %}

{% tab title="NgModule" %}
Provide `TranslocoLocaleModule` in your `TranslocoRootModule`&#x20;

```typescript
import {TranslocoLocaleModule, provideTranslocoLocale } from '@jsverse/transloco-locale';

NgModule({
  imports: [TranslocoLocaleModule],
  providers: [
    provideTranslocoLocale()
  ]
  ...
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}

## **Localization Pipes**

Transloco Locale provides a robust localization API through Angular pipes or services, leveraging the native JavaScript APIs.

### **Date Pipe**

Format dates according to the locale.

```html
<!-- Default short format -->
<span> {{ date | translocoDate }} </span>
<!-- Medium date and time -->
<span> {{ date | translocoDate: { dateStyle: 'medium', timeStyle: 'medium' } }} </span>
<!-- UTC time zone -->
<span> {{ date | translocoDate: { timeZone: 'UTC', timeStyle: 'full' } }} </span>
```

### **Currency Pipe**

Formats numbers into localized currency.

```html
<!-- Default currency -->
<span> {{ 1000000 | translocoCurrency }} </span>
<!-- Currency name -->
<span> {{ 1000000 | translocoCurrency: 'name' }} </span>
<!-- Custom configuration -->
<span> {{ 1000000 | translocoCurrency: 'symbol': { minimumFractionDigits: 0 } }} </span>
```

### **Decimal Pipe**

Formats numbers into localized decimals.

```html
<!-- Default format -->
<span> {{ 1234567890 | translocoDecimal }} </span>
<!-- No grouping -->
<span> {{ 1234567890 | translocoDecimal: { useGrouping: false } }} </span>
```

### **Percent Pipe**

Formats numbers into localized percentages.

```html
<span> {{ 1 | translocoPercent }} </span>
```

***

## **Setting Locale**

You have several options to set your translation locale:

{% stepper %}
{% step %}
#### **Translation File Names**

Use locale-specific file names to automatically set locales on `langChanges$` events.

```
├─ i18n/
   ├─ en-US.json
   ├─ en-GB.json
   ├─ es-ES.json
```
{% endstep %}

{% step %}
#### **Language to Locale Mapping**

Map Transloco languages to locales using `langToLocaleMapping`.

```typescript
// app.config.ts
export const appConfig = {
  providers: [
    provideTranslocoLocale({
      langToLocaleMapping: {
        en: 'en-US',
        es: 'es-ES',
      },
    }),
  ],
};
```
{% endstep %}

{% step %}
#### **Manual Locale Setting**

Manually set the locale via the service

```typescript
export class AppComponent {
  #localeService = inject(TranslocoLocaleService);

  ngOnInit() {
    this.#localeService.setLocale('en-US');
  }
}
```
{% endstep %}
{% endstepper %}

***

## **Configuration Options**

### **Global Configuration**

Customize global locale formatting.

```typescript
const globalFormatConfig = {
  date: { dateStyle: 'long', timeStyle: 'long' },
};

export const appConfig = {
  providers: [
    provideTranslocoLocale({
      localeConfig: {
        global: globalFormatConfig,
      },
    }),
  ],
};
```

### **Component-Level Configuration**

Set locale formatting in individual components.

```typescript
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [provideTranslocoLocaleConfig(localeConfig)],
})
export class MyComponent {}
```

***

## **Service API**

* **localeChanges$**: Observable for active locale changes.
* **localizeDate()**: Formats dates according to the locale.
* **localizeNumber()**: Formats numbers based on the locale.
* **setLocale()**: Updates the active locale.
* **getCurrencySymbol()**: Retrieves the currency symbol for a locale.

```typescript
this.localeService.localeChanges$.subscribe((locale) => console.log(locale));
this.localeService.localizeNumber(1234, 'decimal'); // e.g., 1,234
```

***

## **Custom Transformers**

For advanced cases, implement custom transformers for date and number localization.

```typescript
import { DefaultDateTransformer, DefaultNumberTransformer } from '@jsverse/transloco-locale';

export class CustomDateTransformer extends DefaultDateTransformer {
  transform(date: Date, locale: string, options: DateFormatOptions): string {
    return super.transform(date, locale, options);
  }
}

export class CustomNumberTransformer extends DefaultNumberTransformer {
  transform(value: number, type: string, locale: string, options: Intl.NumberFormatOptions): string {
    return super.transform(value, type, locale, options);
  }
}
```

Provide these custom transformers:

```typescript
provideTranslocoDateTransformer(CustomDateTransformer);
provideTranslocoNumberTransformer(CustomNumberTransformer);
```

***

## **Locale Format Options**

The plugin supports extensive configuration for both numbers and dates, which can be set globally, locally, or at the pipe level. Full documentation for these options can be found in the [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) and [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) references.
