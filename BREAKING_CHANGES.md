# Transloco v7

Packages were moved to the jsverse scope, the versioning continues from the last version of the previous scope.

## Transloco

- The package is now published under the `@jsverse` scope.
- The transpiler matching algorithm has changed, see this [key referencing discussion](https://github.com/jsverse/transloco/discussions/737).
- The transpiler `transpile` method signature has changed to an object.
- `setTranslationKey` method signature has changed, the `lang` parameter was moved to the config.

## Transloco Messageformat

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).
- Updated the transpile method usages.
- Minimum Transloco version is now `^7.0.0`.

## Transloco Locale

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Optimize

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Persist Lang

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Persist Translations

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Preload Langs

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Utils

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Scoped Libs

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

## Transloco Scoped Validator

- The package is now published under the `@jsverse` scope and aligned to the main package major version (v7).

# Transloco V5.0.8-10 & V6

Versions 5.0.8-10 also contains the breaking change in V6 but accidentally weren't marked correctly.

## Transloco

- Update `flat` package to v6 which is ESM

# Transloco V5

V5 was focused on a major infra upgrade to improve Transloco's maintainability also moving to new Angular features.
please take a look at the following:

## Transloco

- `@angular/core` peer dependency is now `>=v16`
- `TRANSLOCO_SCOPE` is now always provided as multi.
- Remove `PersistStorage` type.
- Pipes, directives and components are now standalone.
- Removed `forRoot` from `TranslocoModule`, use `provideTransloco` and other provider functions.

## Transloco Locale

- `@angular/core` peer dependency is now `>=v16`
- Pipes, directives and components are now standalone.
- Injection tokens are now prefixed with `TRANSLOCO_`
- Removed `forRoot` from `TranslocoLocaleModule`, use `provideTranslocoLocale` and other provider functions.

## Transloco Messageformat

- `@angular/core` peer dependency is now `>=v16`
- Removed `TranslocoMessageFormatModule`, use `provideTranslocoMessageformat`.

## Transloco Persist Lang

- `@angular/core` peer dependency is now `>=v16`
- Removed `TranslocoPersistLangModule`, use `provideTranslocoPersistLang`.

## Transloco Persist Translations

- `@angular/core` peer dependency is now `>=v16`
- Removed `TranslocoPersistTranslationsModule`, use `provideTranslocoPersistTranslations`.

## Transloco Preload Langs

- `@angular/core` peer dependency is now `>=v16`
- Removed `TranslocoPreloadLangsModule`, use `provideTranslocoPreloadLangs`.

Other packages were bumped to keep alignment.

# Transloco V4

Transloco now requires `@angular/core` v13 and above:

## Transloco

- `@angular/core` peer dependency is now `>=v13`

## Transloco Locale

- `@angular/core` peer dependency is now `>=v13`

## Transloco Messageformat

- `@angular/core` peer dependency is now `>=v13`

## Transloco Persist Lang

- `@angular/core` peer dependency is now `>=v13`

## Transloco Persist Translations

- `@angular/core` peer dependency is now `>=v13`

## Transloco Preload Langs

- `@angular/core` peer dependency is now `>=v13`

Other packages were bumped to keep alignment.

# Transloco V3

V3 was focused on a major infra upgrade to improve Transloco's maintainability and the ability to create new features easily.
We have removed deprecated code and upgraded dependencies, please take a look at the following:

## Transloco

- `@angular/core` peer dependency is now `>=v12`
- Removed `scopeMapping` property from the `TranslocoConfig`, define the alias on the scope provider instead.
- Removed `provideTranslocoConfig` function.
- LoadedEvent - removed `lang` property.
- `TranslocoTestingModule` removed `withLangs` method, use `forRoot` instead.

## Transloco Locale

- `@angular/core` peer dependency is now `>=v12`
- `TranslocoLocaleModule` removed `init` method, use `forRoot` instead.

## Transloco Messageformat

- `@angular/core` peer dependency is now `>=v12`
- Upgraded `messageformat` from v2.3.0 to `@messageformat/core` v3.0.0, see [changelog](https://github.com/messageformat/messageformat/blob/master/packages/core/CHANGELOG.md#300-2021-05-13) for more information.
- `TranslocoMessageFormatModule` removed `init` method, use `forRoot` instead.

### Features

- Messageformat compiled messages are now cached by default see [#358](https://github.com/jsverse/transloco/issues/358) & [messageformat caching](https://jsverse.gitbook.io/transloco/plugins/message-format#caching-v3). Thank goes to [k3nsei](https://github.com/k3nsei).

## Transloco Persist Lang

- `@angular/core` peer dependency is now `>=v12`
- `TranslocoPersistLangModule` removed `init` method, use `forRoot` instead.

## Transloco Persist Translations

- `@angular/core` peer dependency is now `>=v12`
- `TranslocoPersistTranslationsModule` removed `init` method, use `forRoot` instead.

## Transloco Preload Langs

- `@angular/core` peer dependency is now `>=v12`
- `TranslocoPreloadLangsModule` removed `preload` method, use `forRoot` instead.

# Transloco V2

- Structural directive is now a **memoized** function:

```html
// before {{ t.a.b }} {{ t.hello }} {{ t.someKey | translocoParams: { value: 'value' } }}
```

After:

```html
{{ t('a.b') }} {{ t('hello') }} {{ t('someKey', { value: 'value' }) }}
```

- Dedicated method for when you need to query an object instead of a key:

```ts
// Before
service.translate('a.b', params);
service.selectTranslate('a.b', params);

// After
service.translateObject('a.b', params);
service.selectTranslateObject('a.b', params);
```

- `MissingHandler` interface: removes the second redundant `params` param. (only relevant if you implemented a custom handler)

We also made minor changes in `TranslocoConfig`:

- It's now required to set the available languages in your application:
- We have changed the `listenToLangChange` flag to a more clear `reRenderOnLangChange`:

```ts
{
  provide: TRANSLOCO_CONFIG,
  useValue: {
    availableLangs: ['en', 'es'],
    reRenderOnLangChange: true
  }
}
```

We also allow passing an `object` making it easier for you to use it in a languages dropdown:

`[{ id: 'en', label: 'English'}]`

We need this information to know whether we're dealing with a `language` or a `scope`.

- Change `config.listenToLangChange` to `config.reRenderOnLangChange` to make it more clear.
- Remove callback param support from `translate()`.
- Remove messageformat from the library in favor of the external library.

**We created a schematics command that'll do most of the work for you**

## Features

- Each translation file is now flatten in runtime. This change brings benefits such as lower memory consumption, and faster value accessor.
- Missing handler support for the structural directive.
- Transloco optimizes library which will minify the translation files, flatten AOT, and removes comments.
- Support a fallback language for missing translation value or key.
- Set a scope alias directly in `TRANSLOCO_SCOPE`.

## Coming Soon

A Transloco CLI tool that builds the translation files based on your code in development. Inform you about missing keys and extras. Stay tuned.
