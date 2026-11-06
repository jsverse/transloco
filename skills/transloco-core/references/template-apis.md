# Template & Service APIs

## Structural directive

```html
<ng-container *transloco="let t">
  <p>{{ t('title') }}</p>
  <comp [title]="t('title')"></comp>
</ng-container>
```

Inputs:

- `prefix` (was `read`/`translocoRead`; the input and microsyntax key are **removed in v9**, `ng update` renames them) — namespaces all `t()` calls under a key, e.g. `*transloco="let t; prefix: 'dashboard'"` turns `t('title')` into `dashboard.title`.
- `scope` — loads and merges a lazy scope inline: `*transloco="let t; scope: 'todos'"`.
- `lang` — overrides the language for this template subtree: `*transloco="let t; lang: 'es'"`. Append `|static` (e.g. `'es|static'`) to keep it fixed even if the active language changes elsewhere.
- `loadingTpl` — shows a template while the translation file loads: `*transloco="let t; loadingTpl: loading"` with a paired `<ng-template #loading>`.

The `t` function is memoized per key — repeated calls with the same key in the same template are cheap.

## Pipe

```html
<span>{{ 'home' | transloco }}</span>
<span>{{ 'alert' | transloco: { value: dynamic } }}</span>
<span>{{ 'alert' | transloco: params : 'es' }}</span>
<span [attr.alt]="'hello' | transloco">Attribute</span>
```

Use for one-off bindings/attributes. Avoid using it repeatedly across a template that could instead share one `*transloco="let t"` block — each pipe usage is its own subscription.

## Attribute directive

```html
<span transloco="home"></span>
<span transloco="alert" [translocoParams]="{ value: dynamic }"></span>
<span transloco="home" translocoLang="es"></span>
```

Good for simple static text nodes that don't need the `let t` context function.

## `TranslocoService` API (inject via `inject(TranslocoService)`)

Translation:

- `translate(key, params?, lang?)` — sync; requires translations already loaded.
- `selectTranslate(key, params?, lang?)` — `Observable<string>`; auto-loads, updates on language change. Default choice for anything rendered reactively.
- `translateObject(key, params?)` / `selectTranslateObject(key, params?)` — same pair, but for a nested object/array of translations.
- `getTranslation()` / `getTranslation(lang)` / `getTranslation('scope/lang')` — sync full translation map.
- `selectTranslation(lang?)` — `Observable` of the full translation map, re-emits on language change.
- `setTranslation(translation, lang?, { merge })` — manually set/merge translation data.
- `setTranslationKey(key, value, { lang?, emitChange? })` — set a single key.
- `events$` — observable of `translationLoadSuccess` / `langChanged` events (only fires on load from source, not from cache).

Language:

- `getDefaultLang()` / `setDefaultLang(lang)`
- `getActiveLang()` / `setActiveLang(lang)` — prefer the `activeLang` signal (below) in signal-based code.
- `getAvailableLangs()` / `setAvailableLangs(langs)`
- `setFallbackLangForMissingTranslation({ fallbackLang })` — single language only, even if an array is passed only the first is used.
- `langChanges$` — emits immediately on subscribe with the current language, then on every change.
- `load(lang)` — loads (and caches) a language without activating it.

## Signals API (`@jsverse/transloco`, not on the service)

```typescript
import { translateSignal, translateObjectSignal } from '@jsverse/transloco';

text = translateSignal('hello');
textList = translateSignal(['green', 'blue']);
textVar = translateSignal('hello', { variable: 'world' });
textEs = translateSignal('hello', { variable: 'world' }, 'es');
textScoped = translateSignal(
  'hello',
  { variable: 'world' },
  { scope: 'todos' },
);

// Reactive to signal inputs:
dynamicKey = signal('hello');
text2 = translateSignal(this.dynamicKey);
```

Both `translateSignal`/`translateObjectSignal` must run in an injection context (constructor/field initializer) or receive an explicit `injector` argument.

`TranslocoService.activeLang` is a signal — prefer it over subscribing to `langChanges$` in signal-based components:

```typescript
private transloco = inject(TranslocoService);
lang = this.transloco.activeLang;
upper = computed(() => this.transloco.activeLang().toUpperCase());
```

## Key referencing

Keys can reference other keys in the same file, including passing params through:

```json
{ "hello": "Hello {{name}},", "greet": "{{hello}} have a good day!" }
```

Inside a scope, prefix the referenced key with the scope name (`"fromList": "from {{admin.home}}"`). Avoid circular references (`"a": "{{b}}", "b": "{{a}}"`).
