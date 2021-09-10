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

- Messageformat compiled messages are now cached by default see [#358](https://github.com/ngneat/transloco/issues/358) & [messageformat caching](https://ngneat.github.io/transloco/docs/plugins/message-format#caching). Thank goes to [k3nsei](https://github.com/k3nsei).

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
// before {{ t.a.b }} {{ t.hello }} {{ t.someKey | translocoParams: { value:
'value' } }}
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

For more information see the [schematics upgrade command](https://ngneat.github.io/transloco/docs/schematics/upgrade)

## Features

- Each translation file is now flatten in runtime. This change brings benefits such as lower memory consumption, and faster value accessor.
- Missing handler support for the structural directive.
- Transloco optimizes library which will minify the translation files, flatten AOT, and removes comments.
- Support a fallback language for missing translation value or key.
- Set a scope alias directly in `TRANSLOCO_SCOPE`.

## Coming Soon

A Transloco CLI tool that builds the translation files based on your code in development. Inform you about missing keys and extras. Stay tuned.
