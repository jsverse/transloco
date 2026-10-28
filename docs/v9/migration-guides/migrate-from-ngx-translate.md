---
icon: box-open
---

# Migrate from ngx-translate

## Command

Install the [Transloco CLI](../developer-tools/transloco-cli.md) and run the migration. It rewrites your files in place, so commit your work first.

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-cli@next --save-dev
pnpm exec transloco migrate ngx-translate --input src/app
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-cli@next --dev
yarn transloco migrate ngx-translate --input src/app
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-cli@next --save-dev
npx transloco migrate ngx-translate --input src/app
```
{% endtab %}
{% endtabs %}

`--input` is the folder to migrate, `src/app` unless you say otherwise. What the script can't migrate is left as it is and printed with its file and line, see [After the migration](#after-the-migration).

### The deprecated schematic

The `ngx-migrate` schematic still works until Transloco v10 and logs a deprecation warning. Use `transloco migrate ngx-translate` instead.

{% tabs %}
{% tab title="Angular CLI" %}
```bash
pnpm add @jsverse/transloco-schematics@next
ng g @jsverse/transloco-schematics:ngx-migrate
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
pnpm add @jsverse/transloco-schematics@next
nx g @jsverse/transloco-schematics:ngx-migrate
```
{% endtab %}
{% endtabs %}

***

## What will be done?[​](https://jsverse.github.io/transloco/docs/migration/ngx#what-will-be-done) <a href="#what-will-be-done" id="what-will-be-done"></a>

The migration script will recursively iterate over your HTML and TypeScript files and perform the following replacements:

## **Pipes**

| **Before**                                                 | **After**                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `"hello.world" \| translate`                               | `"hello.world" \| transloco`                               |
| `"hello.world" \| translate \| anotherPipe \| oneMore ...` | `"hello.world" \| transloco \| anotherPipe \| oneMore ...` |
| `"hello" \| translate:{name: 'Jhon'}`                      | `"hello" \| transloco:{name: 'Jhon'}`                      |

Pipes used in bindings will also be replaced, for example: `<component [header]="'hello.world' | translate"`

## **Directives**

| **Before**                                                               | **After**                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>` | `<div [transloco]="'HELLO'" [translocoParams]="{value: 'world'}"></div>` |

A `translate` attribute without a value, whose key is the content of the element (`<span translate>KEY</span>`), is left as it is and printed with its file and line: use `transloco="KEY"` or the pipe. The `translate="yes"` and `translate="no"` attributes of HTML, and attributes such as `data-translate`, are left as they are.

## **Inline templates**

The templates written in the `template` of a `@Component()` are migrated like the template files. A template the script can't read, a template string with an interpolation (`${...}`), a concatenation, or a variable, is left as it is and printed with its file and line, and that file keeps its ngx-translate imports (`TranslateModule`, `TranslatePipe` and `TranslateDirective`) so that its template still compiles. The templates of the other components in that file are still migrated. Migrate it by hand.

## **Imports**

| **Before**                                                              | **After**                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `import {TranslateService} from '@ngx-translate/core';`                 | `import { TranslocoService } from '@jsverse/transloco';`                                                      |
| `import {TranslateModule, TranslateLoader} from '@ngx-translate/core';` | `import {TranslateLoader} from '@ngx-translate/core'; import { TranslocoService } from '@jsverse/transloco';` |

## **Injections**

| **Before**                                           | **After**                                            |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `constructor(private translate: TranslateService) {` | `constructor(private translate: TranslocoService) {` |
| `private translate = inject(TranslateService);`      | `private translate = inject(TranslocoService);`      |

The calls below are replaced on every name the service is injected as: a constructor parameter, or a field or a variable given by `inject()`.

## **Service Usages**

| **Before**                      | **After**                                             |
| ------------------------------- | ----------------------------------------------------- |
| `translateService.currentLang`  | `translateService.getActiveLang()`                    |
| `translateService.onLangChange` | `translateService.langChanges$`, which emits the language string |
| `translateService.use(...)`     | `translateService.setActiveLang(...)`                 |
| `translateService.instant(...)` | `translateService.translate(...)`                     |
| `translateService.get(...)`     | `translateService.selectTranslate(...).pipe(take(1))` |
| `translateService.stream(...)`  | `translateService.selectTranslate(...)`               |

## **Manual Replacements**

| **Before**                | **After**                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `getBrowserLang()`        | In Transloco, this is a pure function that needs to be imported. |
| `getBrowserCultureLang()` | In Transloco, this is a pure function that needs to be imported. |
| `getLangs()` and `langs`  | `getAvailableLangs()`.                                           |
| `addLangs(...)`           | `setAvailableLangs(...)` sets the whole list.                    |
| `set(key, value, lang)`   | `setTranslationKey(key, value, { lang })`, whose third argument is an options object. |
| `currentLoader`, `reloadLang(...)`, `resetLang(...)`, `defaultLang`, `onTranslationChange`, `onDefaultLangChange`, `getParsedResult(...)`, `getStreamOnTranslationChange(...)`, `translations`, `store`, `compiler`, `parser`, `missingTranslationHandler` | No direct equivalent in Transloco. |

These members are left as they are, and each use is printed with its file and line. A leftover `LangChangeEvent` is printed with its file and line too: `langChanges$` emits the language string, not an event object, so adjust the code that reads `event.lang`. `getTranslation(...)` and `setTranslation(...)` keep their names, which the `TranslocoService` has too, but take other arguments: check them by hand.

## **Modules**

| **Before**                                                                                                              | **After**         |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `TranslateModule.forChild({ loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] } })` | `TranslocoModule` |

## **After the migration**

The script rewrites the templates and the sources, a few steps are left to you:

1. Set up Transloco in place of `provideTranslateService()` / `TranslateModule.forRoot()` and the `TranslateHttpLoader`: `provideTransloco()` with your languages and a `TranslocoLoader` that loads your translation files. `ng add @jsverse/transloco` writes both.
2. Import `TranslocoPipe` or `TranslocoDirective` in a standalone component whose template uses them and didn't import the `TranslatePipe` or the `TranslateDirective` before (the script renames the imports it finds).
3. Go through what the script printed: the uses of the service without a counterpart, the `translate` attributes without a value and the inline templates it couldn't read.
