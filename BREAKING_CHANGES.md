# Transloco V2

- Each translation file is now flatten in runtime:

From:

```json
{
  "a": {
    "b": {
      "c": ""
    }
  }
}
```

To:

```json
{
  "a.b.c": ""
}
```

This change brings the following benefits:

- Lower memory consumption.
- Faster value accessor.
- Missing handler for the structural directive.

So now when using the structural directive, you should use the bracket notation:

```html
// before 

{{ t.a.b }} {{ t.hello }} 

// After 

{{ t['a.b'] }} {{ t.hello }}
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
- It's now required to set the available languages in your application:

```ts
{
  provide: TRANSLOCO_CONFIG,
  useValue: {
    availabeLangs: ['en', 'es']
  }
}
```

We also allow passing an `object` making it easier for you to use it in a languages dropdown:

`[{ id: 'en', label: 'English'}]`

We use this information to know whether we deal with a `language` or a `scope`.

- Change `config.listenToLangChange` to `config.renderLangOnce` to make it more clear.
- Remove callback param support from `translate()`.
- Remove messageformat from the library in favor of the external library.

## Features

- Missing handler support for the structural directive.
- Transloco optimizes library which will minify the translation files, flatten AOT, and removes comments.
- Support a fallback language for missing translation value or key.
- Set a scope alias directly in `TRANSLOCO_SCOPE`.

## Coming Soon

A Transloco CLI tool that builds the translation files based on your code in development. Inform you about missing keys and extras. Stay tuned.
