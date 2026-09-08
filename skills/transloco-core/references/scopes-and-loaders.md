# Scopes, Lazy Loading, Multi-Language, Extension Points

## Scopes (lazy-loaded translation files)

Scopes follow **Angular DI rules** — only declare them where the scoped translations are actually needed (a lazy route's providers or a component's providers), not at the root, or they defeat lazy loading.

```typescript
// todos.routes.ts
export const TODO_ROUTES: Route = {
  path: '',
  loadComponent: () =>
    import('./todos.component').then((m) => m.TodosComponent),
  providers: [
    provideTranslocoScope('todos'),
    provideTranslocoScope('todos', { scope: 'shared', alias: 'sharedAlias' }),
  ],
};
```

Or in a component's `providers: [provideTranslocoScope('todos')]`, or inline via `*transloco="let t; scope: 'todos'"`.

This loads `todos/<lang>.json` and merges it under the `todos` namespace (camelCased scope name, unless `scopes.keepCasing` is set or an `alias` is provided): access via `t('todos.title')`, `'todos.title' | transloco`, or `transloco="todos.submit"`.

## Inline loaders (no HTTP request)

```typescript
export const loader = ['en', 'es'].reduce((acc, lang) => {
  acc[lang] = () => import(`../i18n/${lang}.json`);
  return acc;
}, {});

providers: [provideTranslocoScope({ scope: 'scopeName', loader })];
```

## Multiple languages simultaneously

```typescript
@Component({
  providers: [provideTranslocoLang('es')], // applies to this component + its children
})
export class MyComponent {}
```

Or inline: `*transloco="let t; lang: 'en'"`. Append `|static` (`provideTranslocoLang('es|static')` or `lang: 'es|static'`) to keep that language fixed even when the global active language changes elsewhere.

## Loading templates

```typescript
@Component({ providers: [provideTranslocoLoadingTpl('<p>Loading...</p>')] })
```

or inline: `*transloco="let t; loadingTpl: loading"` with `<ng-template #loading>...</ng-template>`. Accepts raw HTML or a component. Can be provided globally in root providers too.

## Extension points ("Hack the Library")

- **`TranslocoLoader`** — override how translation files are fetched (`getTranslation(lang)`).
- **`TranslocoInterceptor`** — mutate translation data/keys before they're saved (`preSaveTranslation`, `preSaveTranslationKey`).
- **`TranslocoMissingHandler`** — control what happens when a key is missing (default: warn in dev, return `''`).
- **`TranslocoFallbackStrategy`** — control fallback language selection (`getNextLangs(failedLang)`), default uses `config.fallbackLang`.

Register custom implementations with the matching `provideTransloco*` function (`provideTranslocoLoader`, `provideTranslocoInterceptor`, `provideTranslocoMissingHandler`, `provideTranslocoFallbackStrategy`).

## Transpiler

- **`DefaultTranspiler`** — resolves `{{ param }}` interpolation; customize markers via `config.interpolation`.
- **`FunctionalTranspiler`** — adds `[[ fnName(arg1, arg2) ]]` syntax, resolving `fnName` via DI (`provide: 'fnName', useClass: MyResolver implements TranslocoTranspilerFunction`). Compatible with the default transpiler (opt-in, no migration needed for existing translations). Escape literal commas in args with `\,`.
- **Custom transpiler** — implement `TranslocoTranspiler.transpile(value, params, translation, key)` and provide via `provideTranslocoTranspiler(CustomTranspiler)`.

Anti-pattern: reaching for a custom transpiler/functional transpiler for simple pluralization/gender — use the `transloco-plugins` skill's messageformat (ICU) reference instead, it's purpose-built for that.
