---
icon: globe
---

# Migrate from ngx-translate

## Command

{% tabs %}
{% tab title="Angular CLI" %}

```bash
ng g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}

{% tab title="Nx 🐋" %}

```bash
pnpm add @jsverse/transloco-schematics
nx g @jsverse/transloco-schematics:ngx-migrate
```

{% endtab %}
{% endtabs %}

---

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

## **Imports**

| **Before**                                                              | **After**                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `import {TranslateService} from '@ngx-translate/core';`                 | `import { TranslocoService } from '@jsverse/transloco';`                                                      |
| `import {TranslateModule, TranslateLoader} from '@ngx-translate/core';` | `import {TranslateLoader} from '@ngx-translate/core'; import { TranslocoService } from '@jsverse/transloco';` |

## **Constructor Injections**

| **Before**                                           | **After**                                            |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `constructor(private translate: TranslateService) {` | `constructor(private translate: TranslocoService) {` |

## **Service Usages**

| **Before**                      | **After**                                             |
| ------------------------------- | ----------------------------------------------------- |
| `translateService.currentLang`  | `translateService.getActiveLang()`                    |
| `translateService.onLangChange` | `translateService.langChanges$`                       |
| `translateService.use(...)`     | `translateService.setActiveLang(...)`                 |
| `translateService.instant(...)` | `translateService.translate(...)`                     |
| `translateService.get(...)`     | `translateService.selectTranslate(...).pipe(take(1))` |
| `translateService.stream(...)`  | `translateService.selectTranslate(...)`               |
| `translateService.set(...)`     | `translateService.setTranslation(...)`                |

## **Manual Replacements**

| **Before**                | **After**                                                        |
| ------------------------- | ---------------------------------------------------------------- |
| `getBrowserLang()`        | In Transloco, this is a pure function that needs to be imported. |
| `getBrowserCultureLang()` | In Transloco, this is a pure function that needs to be imported. |
| `currentLoader`           | No equivalent in Transloco.                                      |
| `addLangs(...)`           | No equivalent in Transloco.                                      |
| `getLangs(...)`           | No equivalent in Transloco.                                      |
| `reloadLang(...)`         | No equivalent in Transloco.                                      |
| `resetLang(...)`          | No equivalent in Transloco.                                      |

## **Modules**

| **Before**                                                                                                              | **After**         |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `TranslateModule.forChild({ loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] } })` | `TranslocoModule` |
