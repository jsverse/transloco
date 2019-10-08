<br />
<p align="center">
 <img width="50%" height="50%" src="./logo.png">
</p>

> Translation can drive you crazy, here's the cure!

The internationalization (i18n) library for Angular

[![Build Status](https://img.shields.io/travis/datorama/akita.svg?style=flat-square)](https://travis-ci.org/ngneat/transloco)
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors-)
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
[![coc-badge](https://img.shields.io/badge/codeof-conduct-ff69b4.svg?style=flat-square)]()
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e5079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![spectator](https://img.shields.io/badge/tested%20with-spectator-2196F3.svg?style=flat-square)]()
[![Join the chat at https://gitter.im/ngneat-transloco](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/ngneat-transloco/lobby?source=orgpage)

## Features

✅ Clean and DRY templates <br>
✅ Support for Lazy Load<br>
✅ Support for Multiple Languagues<br>
✅ Support for Multiple Fallbacks<br>
✅ Support for Testing<br>
✅ Hackable<br>

## Table of Contents

- [Installation](#installation)
- [Transloco Config](#config-options)
- [Set the Available Languages](#set-the-available-languages)
- [Translation in the Template](#translation-in-the-template)
- [Programmatical Translation](#programmatical-translation)
- [Service API](#service-api)
- [Lazy Load Translation Files](#lazy-load-translation-files)
- [Using Multiple Languages Simultaneously](#using-multiple-languages-simultaneously)
- [Custom Loading Template](#custom-loading-template)
- [Hack the Library](#hack-the-library)
- [SSR Support](#ssr-support)
- [Unit Testing](#unit-testing)
- [Additional Functionality](#additional-functionality)
- [ngx-translate Migration](#migration-from-ngx-translate)
- [Plugins](#plugins)
- [Comparison to other libraries](#comparison-to-other-libraries)
- [Schematics Support](https://github.com/ngneat/transloco/blob/master/schematics/README.md)
- [Recipes](#recipes)

## Installation

Install the library using Angular CLI:

`ng add @ngneat/transloco`

As part of the installation process you'll be presented with questions; Once you answer them, everything you need will automatically be created for you. Let's take a closer look at the generated files:

First, Transloco creates boilerplate files for the requested translations:

```json
// assets/i18n/en.json
{
  "hello": "transloco en",
  "dynamic": "transloco {{value}}"
}
```

```json
// assets/i18n/es.json
{
  "hello": "transloco es",
  "dynamic": "transloco {{value}}"
}
```

Next, it injects the `TranslocoModule` into the `AppModule`, and sets some default options for you:

```ts
// app.module
import { TRANSLOCO_CONFIG, TranslocoModule } from '@ngneat/transloco';
import { HttpClientModule } from '@angular/common/http';
import { httpLoader } from './loaders/http.loader';
import { environment } from '../environments/environment';

@NgModule({
  imports: [TranslocoModule, HttpClientModule],
  providers: [
    httpLoader,
    {
      provide: TRANSLOCO_CONFIG,
      useValue: {
        availableLangs: ['en', 'es'],
        prodMode: environment.production,
        defaultLang: 'en'
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

It also injects the `httpLoader` into the `AppModule` providers:

```ts
import { HttpClient } from '@angular/common/http';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from '@ngneat/transloco';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(langPath: string) {
    return this.http.get<Translation>(`/assets/i18n/${langPath}.json`);
  }
}

export const httpLoader = { provide: TRANSLOCO_LOADER, useClass: HttpLoader };
```

The `HttpLoader` is a class that implements the `TranslocoLoader` interface. It's responsible for instructing transloco how to load the translation files. It uses Angular HTTP client to fetch the files, based on the given path (We'll see why it called path on the lazy load section).

### Config Options

Let's explain each one of the `config` options:

- `reRenderOnLangChange`: Applications that don't allow the user to change the language in runtime (i.e., from a dropdown), should leave it `false`. It can save on memory by rendering the view once and unsubscribing from the language changes event (defaults to `false`).
- `defaultLang`: Sets the default language
- `fallbackLang`: Sets the default language/s to use as a fallback. See the [`TranslocoFallbackStrategy`](#transloco-fallback-strategy) section if you need to customize it.
- `failedRetries`: How many time should Transloco retry to load translation files, in case of a load failure (defaults to 2)
- `prodMode`: Whether the application runs in production mode (defaults to `false`).
- `availableLangs`: The available languages in your application
- `missingHandler.allowEmpty`: Whether to allow empty values
- `missingHandler.useFallbackTranslation`: Whether to use the fallback language for missing keys or values
- `flatten.aot`: Check the optimization [plugin](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-optimize)

## Set the Available Languages

Next, you need to set the available languages in your application. You have two ways to do it:

- Add the `config.availableLangs` property
- Call `translocoService.setAvailableLangs(langs)`

Note that you can also pass an object containing a `label` and an `id` keys:

```ts
{
  availableLangs: [{ id: 'en', label: 'English' }];
}
```

This can become handy when you need to use it for a languages dropdown.

## Translation in the Template

Transloco provides three ways to translate your templates:

### Using the Structural Directive

This is the recommended approach. It's DRY and efficient, as it creates **one** subscription per template:

```html
<ng-container *transloco="let t;">
  <p>{{ t('some.nested.key') }}</p>
  <p>{{ t('alert', { value: dynamic }) }}</p>
</ng-container>

<ng-template transloco let-t>
  {{ t('home') }}
</ng-template>
```

Note that the `t` function is **memoized**. It means that given the same `key` it will return the result directly from the cache.

#### Using the read input

You can use the `read` input in your structural directive to get translations of a particular nested (including deeply nested) property.

Let's say you need to use the `dashboard` scope all over the template. Given this translation object:

```typescript
{
  common: {
    foo: 'Foo',
    bar: 'Bar'
  },
  dashboard: {
    title: 'Title',
    desc: 'Desc'
  }
}
```

you can do:

```html
<ng-container *transloco="let t; read: 'dashboard'">
  <h1>{{ t('title') }}</h1>
  <p>{{ t('desc') }}</p>
</ng-container>
```

without having to repeat the `dashboard` key in each translation.

### Using the Attribute Directive

```html
<span transloco="home"></span>
<span transloco="alert" [translocoParams]="{ value: dynamic }"></span>
<span [transloco]="key"></span>
```

### Using the Pipe

```html
<span>{{ 'home' | transloco }}</span>
<span>{{ 'alert' | transloco: { value: dynamic } }}</span>

<span [attr.alt]="'hello' | transloco">Attribute</span>
<span [title]="'hello' | transloco">Property</span>
```

## Programmatical Translation

Sometimes you may need to translate a key in a component or a service. To do so, you can inject the `TranslocoService` and use its `translate` method:

```ts
export class AppComponent {
  constructor(private service: TranslocoService) {}

  ngOnInit() {
    // Please read the accompanying note before using it
    this.service.translate('hello');
    this.service.translate('hello', { value: 'world' });
    this.service.translate(['hello', 'key']);
    this.service.translate('hello', params, 'en');
  }
}
```

Note that in order to safely use this method, you are responsible for ensuring that the translation files have been successfully loaded by the time it's called. If you aren't sure, you can use the `selectTranslate()` method instead:

```ts
this.service.selectTranslate('hello').subscribe(value => ...);
this.service.selectTranslate('hello', params, lang).subscribe(value => ...);

// When quering an object that should be transpiled
// For example: { a: { b: 'Hello {{ value }}', c: 'Hey {{ dynamic }}' }}
this.service.selectTranslateObject('a', {
  'b': { value: '' },
  'c': { dynamic: '' }
}).subscribe(obj => ...);

// Returns the active language translation
this.service.selectTranslation().subscribe(translation => ...);

// Load and returns the provided language
this.service.selectTranslation('es').subscribe(translation => ...);
```

Note that `selectTranslate` will emit each time the active language is changed.

## Service API

- `getDefaultLang` - Returns the default language
- `setDefaultLang` - Sets the default language
- `getActiveLang` - Gets the current active language
- `setActiveLang` - Sets the current active language
- `getAvailableLangs` - Gets the available languages
- `setAvailableLangs` - Sets the available languages

```ts
service.setActiveLang(lang);
```

- `getTranslation(lang?: string)` - Returns the selected language translation or, if a language isn't passed, all of them:

```ts
service.getTranslation();
service.getTranslation('en');
```

- `setTranslation()` : Manually sets a translations object to be used for a given language, set `merge` to true if you want to append the translations instead of replacing them.

```ts
service.setTranslation({ ... }); // defaults to active language
service.setTranslation({ ... }, 'es');
service.setTranslation({ ... }, 'en', { merge: false } );
```

- `setTranslationKey` - Sets the translated value of a key. If a language isn't specified in the third parameter, it sets the key value for the current active language:

```ts
service.setTranslationKey('key', 'value');
service.setTranslationKey('key.nested', 'value');
service.setTranslationKey('key.nested', 'value', 'en');
```

- `langChanges$` - Listens to the language change event:

```ts
service.langChanges$.subscribe(lang => lang);
```

- `events$` - Listens to the translation loading events:

```ts
service.events$.pipe(filter(e => e.type === 'translationLoadSuccess')).subscribe(payload => payload.lang);

service.events$.pipe(filter(e => e.type === 'translationLoadFailure')).subscribe(payload => payload.lang);
```

- `load(lang)` - Load the given language, and add it to the service

```ts
service.load('en').subscribe();
```

## Lazy Load Translation Files

### Scope Configuration

Let's say we have a todos page and we want to create separate translation files for this page, and load them only when the user navigates there. First, we need to create a `todos` folder (or whatever name you choose); In it, we create a translation file for each language we want to support:

```
├─ i18n/
   ├─ en.json
   ├─ es.json
   ├─ todos/
      ├─ en.json
      ├─ es.json
```

There are 3 levels of setting the translation scope:

1. We can set it inside the _lazy module_ module providers :

```ts
const routes: Routes = [
  {
    path: '',
    component: TodosComponent
  }
];

@NgModule({
  declarations: [TodosComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'todos' }],
  imports: [CommonModule, RouterModule.forChild(routes), TranslocoModule]
})
export class TodosModule {}
```

2. We can set it in a component's providers:

```ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'todos'
    }
  ]
})
export class MyComponent {}
```

3. We can set the `scope` input in the `transloco` structural directive:

```html
<ng-container *transloco="let t; scope: 'todos';">
  <h1>{{ t('todos.keyFromTodo') }}</h1>
</ng-container>
```

Each one of these options tells Transloco to load the corresponding `scope` based on the active language and merge it under the `scope` namespace into the active language translation object.

For example, if the active language is `en`, it will load the `todos/en.json` file, and will set the translation to be the following:

```ts
{
  header: '',
  login: '',
  todos: {
    submit: '',
    title: ''
  }
}
```

Now we can access each one of the `todos` keys by using the `todos` namespace:

```html
{{ 'todos.title' | transloco }}

<span transloco="todos.submit"></span>
```

By default, the namespace will be the scope name (camel cased), but we can override it in two ways:

1. by using the `config.scopeMapping` config:

```ts
{
  provide: TRANSLOCO_CONFIG,
   useValue: {
    defaultLang: 'en',
    scopeMapping: {
      todos: 'customName'
    }
  }
}
```

2. by providing custom `alias` name in the module/component scope provider:

```ts
{
  provide: TRANSLOCO_SCOPE,
  useValue: { scope: 'todos', alias: 'customName' }
}
```

Now we can access it through `customName` instead of the original scope name (`todos` in our case):

```html
{{ 'customName.title' | transloco }}

<span transloco="customName.submit"></span>
```

## Using Multiple Languages Simultaneously

There are times you may need to use a different language in a specific part of the template, or in a particular component or module. This can be achieved in a similar way to the previous example, except here set the `TRANSLOCO_LANG` provider either in **lazy module** providers list, the component providers or in the template.

Here's an example of setting it in a component's providers:

```ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [
    {
      provide: TRANSLOCO_LANG,
      useValue: 'es'
    }
  ]
})
export class MyComponent {}
```

Using Angular's DI rules, this will ensure that the language in this component's template and all of its children's templates is `es`.

Alternatively, here is how to use it directly in the template:

```html
<ng-container *transloco="let t; lang: 'en'">
  <p>Inline (en) wins: {{ t('home') }}</p>
</ng-container>
```

Note that it will be used as the **initial language**. If you need it to be **static**, you can use the `static` pipe: `en|static`.

## Custom Loading Template

Transloco provides you with a way to define a loading template, that will be used while the translation file is loading.

Similarly to the previous examples, set the `TRANSLOCO_LOADING_TEMPLATE` provider either in lazy module providers, component providers, in the template, or even in the `app.module` itself (affecting the entire app). For example:

```ts
@Component({
  selector: 'my-comp',
  templateUrl: './my-comp.component.html',
  providers: [
    {
      provide: TRANSLOCO_LOADING_TEMPLATE,
      useValue: '<p>loading...</p>'
    }
  ]
})
export class MyComponent {}
```

It can take a raw HTML value, or a custom Angular component.

Alternatively, here is how to use it directly in the template:

```html
<ng-container *transloco="let t; loadingTpl: loading">
  <h1>{{ t('title') }}</h1>
</ng-container>

<ng-template #loading>
  <h1>Loading...</h1>
</ng-template>
```

## Hack the Library

Transloco provides you with an option to customize each one of its buliding blocks. Here's a list of the things you can customize:

#### Transloco Loader

The loader provides you with the ability to override the default handling of translation file loading.

```ts
export class CustomLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    if(langInLocalStorage) {
      return of(langFromStorage);
    }

    return ...
  }
}

export const custom = {
  provide: TRANSLOCO_LOADER,
  useClass: CustomLoader
}
```

#### Transloco Interceptor

The interceptor provides you with the ability to manipulate the translation object before it is saved by the service.

```ts
export class CustomInterceptor implements TranslocoInterceptor {
  preSaveTranslation(translation: Translation, lang: string): Translation {
    return translation;
  }

  preSaveTranslationKey(key: string, value: string, lang: string): string {
    return value;
  }
}

export const custom = {
  provide: TRANSLOCO_INTERCEPTOR,
  useClass: CustomInterceptor
};
```

The `preSaveTranslation` method is called before the translation is saved by the service, and the `preSaveTranslationKey` is called before a new key-value pair is saved by the `service.setTranslationKey()` method.

#### Transloco Transpiler

The transpiler is responsible for resolving the given value. For example, the default transpiler transpiles `Hello {{ key }}` and replaces the dynamic variable `key` based on the given params, or the translation object.

```ts
export class CustomTranspiler implements TranslocoTranspiler {
  transpile(value: any, params, translation: Translation): any {
    return ...;
  }
}

export const custom = {
  provide: TRANSLOCO_TRANSPILER,
  useClass: CustomTranspiler
}
```

#### Transloco Missing Handler

This handler is responsible for handling missing keys. The default handler calls `console.warn()` with the key when `config.isProdMode` is set to `false`, and returns an empty string to use as a replacement for the missing key's value.

```ts
export class CustomHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig) {
    return '...';
  }
}

export const custom = {
  provide: TRANSLOCO_MISSING_HANDLER,
  useClass: CustomHandler
};
```

#### Transloco Fallback Strategy

The fallback strategy is responsible for loading the fallback translation file, when the selected active language has failed to load. The default behavior is to load the language set in the `config.fallbackLang`, and set it as the new active language.

When you need more control over this functionality, you can define your own strategy:

```ts
export class CustomFallbackStrategy implements TranslocoFallbackStrategy {
  getNextLangs(failedLang: string) {
    return ['langOne', 'langTwo', 'langThree'];
  }
}

export const custom = {
  provide: TRANSLOCO_FALLBACK_STRATEGY,
  useClass: CustomFallbackStrategy
};
```

The `getNextLangs` method is called with the failed language, and should return an array containing the next languages to load, in order of preference.

## SSR Support

Create a new CLI project and add SSR support:

`ng add @nguniversal/express-engine --clientProject <PROJECT-NAME>`

When employing Angular SSR, we need to change our loader base path to be absolute instead of relative, in order for it to work. Run `ng add @ngneat/transloco` and choose the SSR option. This will make sure to update the loader to use an absolute path.

Moreover, Transloco will add a `baseUrl` key to the environment object. Make sure to update it based on your environments.

```ts
export const environment = {
  production: false,
  baseUrl: 'http://localhost:4200' <====
};
```

## Unit Testing

When running specs, we want to have the languages available immediately, in a synchronous fashion. Transloco provides you with a `TranslocoTestingModule`, where you can pass the languages you need in your specs. For example:

```ts
import { TranslocoTestingModule } from '@ngneat/transloco';
import en from '../../assets/i18n/en.json';
import scopeScope from '../../assets/i18n/some-scope/en.json';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslocoTestingModule.withLangs({
          en,
          'some-scope/en': scopeScope
        }, translocoConfig?)
      ],
      declarations: [AppComponent]
    }).compileComponents();
  }));

  it('should work', function() {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('h1')).nativeElement.innerText).toBe('hello');
  });
});
```

Note that in order to import JSON files, you need to configure the TypeScript compiler by adding the following properties in `tsconfig.json`:

```json
{
  "resolveJsonModule": true,
  "esModuleInterop": true
}
```

## Additional Functionality

- You can point to specific keys in other keys from the same translation file. For example:

```json
{
  "alert": "alert {{value}} english",
  "home": "home english",
  "fromList": "from {{home}}"
}
```

So the result of `service.translate('fromList')` will be: "from home english".

- You don't have to inject the service each time you need to translate a key. Transloco has an exported `translate()` function:

```ts
import { translate } from '@ngneat/transloco';

translate('someKey');
```

- `getBrowserLang()` - Returns the language code name from the browser, e.g. "en"
- `getBrowserCultureLang()` - Returns the culture language code name from the browser, e.g. "en-US"

```ts
import { getBrowserLang, getBrowserCultureLang } from '@ngneat/transloco';
```

## Migration from ngx-translate

Transloco provides a schematics [command](https://github.com/ngneat/transloco/blob/master/schematics/src/migrate/ngx-translate-migration.md) that will help you with the migration process.

## Comparison to other libraries

| Feature                           | @ngneat/transloco                                                                                             | @ngx-translate/core                                             | Angular i18n | angular-l10n   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------ | -------------- |
| Actively Maintained               | ✅                                                                                                            | ❌ [See here](https://github.com/ngx-translate/core/issues/783) | ✅           | ✅             |
| Runtime Lang Change               | ✅                                                                                                            | ✅                                                              | ❌           | ✅             |
| Schematics                        | ✅                                                                                                            | ❌                                                              | ❌           | ❌             |
| Custom Loading Template           | ✅                                                                                                            | ❌                                                              | ❌           | ❌             |
| Multiple Languages Simultaneously | ✅                                                                                                            | ✅\*                                                            | ❌           | ❌             |
| Lazy Load Translations            | ✅                                                                                                            | ✅\*                                                            | ✅           | ✅             |
| Multiple Fallbacks                | ✅                                                                                                            | ❌                                                              | ❌           | ✅             |
| Hackable                          | ✅                                                                                                            | ✅                                                              | ❌           | ✅ (partially) |
| Testing Module                    | ✅                                                                                                            | ✅ External library                                             | ❌           | ❌             |
| Structural Directive              | ✅                                                                                                            | ❌                                                              | ❌           | ❌             |
| Attribute Directive               | ✅                                                                                                            | ✅                                                              | ✅           | ✅             |
| Pipe                              | ✅                                                                                                            | ✅                                                              | ❌           | ✅             |
| Pluralization                     | ✅ [Official Plugin](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-messageformat) | ✅ External library                                             | ✅           | ✅             |
| Locale                            | ✅ [Official Plugin](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-locale)        | ❌                                                              | ✅           | ✅             |

(\*) Works **only** by creating a new service instance and mark it as isolated, and it's not supported at the directive level.

If you find any mistakes in the table, open an issue, and we'll fix them asap, thanks in advance.

## Plugins

- [Messageformat](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-messageformat) (official)
- [Persist Language](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-persist-lang) (official)
- [Persist Translations](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-persist-translations) (official)
- [Preload Languages](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-preload-langs) (official)
- [Translators Comments](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-remove-comments) (official)
- [Locale](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-locale) (official)
- [Transloco Optimize](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-optimize) (official)
- [Translations Validator](https://github.com/ngneat/transloco/tree/master/projects/ngneat/transloco-validator) (official)

## Recipes

- [Prefetch the User Language](https://github.com/ngneat/transloco/tree/master/recipes/prefetch.md)
- [Xliff Loader](https://github.com/ngneat/transloco/tree/master/recipes/xliff.md)

## Support

For any questions or deliberations join our [Gitter channel](https://gitter.im/ngneat-transloco/lobby#)

## Core Team

<table>
  <tr>
    <td align="center"><a href="https://www.netbasal.com"><img src="https://avatars1.githubusercontent.com/u/6745730?v=4" width="100px;" alt="Netanel Basal"/><br /><sub><b>Netanel Basal</b></sub></a><br /></td>
    <td align="center"><a href="https://github.com/shaharkazaz"><img src="https://avatars2.githubusercontent.com/u/17194830?v=4" width="100px;" alt="Shahar Kazaz"/><br /><sub><b>Shahar Kazaz</b></sub></a><br /></td>
    <td align="center"><a href="https://github.com/itayod"><img src="https://avatars2.githubusercontent.com/u/6719615?v=4" width="100px;" alt="Itay Oded"/><br /><sub><b>Itay Oded</b></sub></a><br /></td>
    </tr>
</table>

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://twitter.com/irustm"><img src="https://avatars1.githubusercontent.com/u/16316579?v=4" width="100px;" alt="Rustam"/><br /><sub><b>Rustam</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=irustm" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Coly010"><img src="https://avatars2.githubusercontent.com/u/12140467?v=4" width="100px;" alt="Colum Ferry"/><br /><sub><b>Colum Ferry</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=Coly010" title="Code">💻</a> <a href="https://github.com/ngneat/transloco/commits?author=Coly010" title="Documentation">📖</a> <a href="#ideas-Coly010" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ngneat/transloco/commits?author=Coly010" title="Tests">⚠️</a> <a href="#blog-Coly010" title="Blogposts">📝</a></td>
    <td align="center"><a href="https://www.armanozak.com/"><img src="https://avatars3.githubusercontent.com/u/15855540?v=4" width="100px;" alt="Levent Arman Özak"/><br /><sub><b>Levent Arman Özak</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=armanozak" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/theblushingcrow"><img src="https://avatars3.githubusercontent.com/u/638818?v=4" width="100px;" alt="Inbal Sinai"/><br /><sub><b>Inbal Sinai</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=theblushingcrow" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.larskniep.nl"><img src="https://avatars1.githubusercontent.com/u/1215195?v=4" width="100px;" alt="Lars Kniep"/><br /><sub><b>Lars Kniep</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=larscom" title="Code">💻</a> <a href="#ideas-larscom" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/fxck"><img src="https://avatars1.githubusercontent.com/u/1303561?v=4" width="100px;" alt="Aleš"/><br /><sub><b>Aleš</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=fxck" title="Code">💻</a> <a href="#ideas-fxck" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://www.codamit.dev"><img src="https://avatars0.githubusercontent.com/u/8522558?v=4" width="100px;" alt="Koala"/><br /><sub><b>Koala</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=Edouardbozon" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/DerSizeS"><img src="https://avatars3.githubusercontent.com/u/708090?v=4" width="100px;" alt="Oleg Teterin"/><br /><sub><b>Oleg Teterin</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=DerSizeS" title="Code">💻</a></td>
    <td align="center"><a href="https://twitter.com/maxime1992"><img src="https://avatars0.githubusercontent.com/u/4950209?v=4" width="100px;" alt="Maxime"/><br /><sub><b>Maxime</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=maxime1992" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/zufarzhan"><img src="https://avatars3.githubusercontent.com/u/22148960?v=4" width="100px;" alt="Zufar Ismanov"/><br /><sub><b>Zufar Ismanov</b></sub></a><br /><a href="https://github.com/ngneat/transloco/commits?author=zufarzhan" title="Code">💻</a> <a href="#ideas-zufarzhan" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
