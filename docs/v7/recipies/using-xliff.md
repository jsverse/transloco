# Using Xliff

If your project uses XLIFF for translation management, Transloco makes it easy to handle and load these files. In this section, we'll walk you through setting up a custom loader to work with XLIFF translation files, and configure it in your Angular application.

{% stepper %}
{% step %}
### Install the XLIFF Package

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add xliff
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add xliff
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install xliff
```
{% endtab %}
{% endtabs %}


{% endstep %}

{% step %}
### Implement a Custom XLIFF Loader

Replace the default HTTP loader in Transloco with a custom loader that fetches and processes XLIFF translation files.

{% tabs %}
{% tab title="Standalone" %}
```typescript
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TranslocoModule,
} from '@jsverse/transloco';
import { Injectable, isDevMode, NgModule } from '@angular/core';
import { from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import xliff from 'xliff/xliff2js';

// Utility function to convert XLIFF to the Transloco format
function toTranslationFormat(json: any): Translation {
  const obj = json.resources.transloco;
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key].target;
    return acc;
  }, {} as Translation);
}

@Injectable({ providedIn: 'root' })
export class TranslocoXliffHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http
      .get<Translation>(`/assets/i18n/${lang}.xlf`, { responseType: 'text' })
      .pipe(
        switchMap((translation) => from(xliff(translation))),
        map(toTranslationFormat)
      );
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideTransloco({
      ...,
      loader: TranslocoXliffHttpLoader
    }),
  ],
});

```
{% endtab %}

{% tab title="NgModule" %}
```typescript
import { HttpClient } from '@angular/common/http';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TranslocoModule,
} from '@jsverse/transloco';
import { Injectable, isDevMode, NgModule } from '@angular/core';
import { from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import xliff from 'xliff/xliff2js';

// Utility function to convert XLIFF to the Transloco format
function toTranslationFormat(json: any): Translation {
  const obj = json.resources.transloco;
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key].target;
    return acc;
  }, {} as Translation);
}

@Injectable({ providedIn: 'root' })
export class TranslocoXliffHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http
      .get<Translation>(`/assets/i18n/${lang}.xlf`, { responseType: 'text' })
      .pipe(
        switchMap((translation) => from(xliff(translation))),
        map(toTranslationFormat)
      );
  }
}

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      ...,
      loader: TranslocoXliffHttpLoader
    }),
  ],
})
export class TranslocoRootModule {}
```
{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}
### Sample XLIFF Translation File (v1.2)

Create your XLIFF translation files in the `assets/i18n` folder. Here's an example of a v1.2 XLIFF file:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="transloco">
    <body>
      <trans-unit id="title">
        <source>Hello Transloco!</source>
        <target>Bonjour Transloco!</target>
      </trans-unit>
    </body>
  </file>
</xliff>
```
{% endstep %}
{% endstepper %}
