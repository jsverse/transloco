---
icon: arrow-up-right-dots
---

# Migrate to v9

Transloco v9 ships an `ng update` migration that applies most of the breaking changes for you.

{% tabs %}
{% tab title="Angular CLI" %}
```bash
ng update @jsverse/transloco
```
{% endtab %}

{% tab title="Nx 🐋" %}
```bash
nx migrate @jsverse/transloco
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
v9 is currently in alpha and published under the `next` tag. Install it with `@jsverse/transloco@next`.
{% endhint %}

***

## What the migration does

<table><thead><tr><th>Change</th><th width="140">Automated?</th></tr></thead><tbody><tr><td>Renames the removed <code>translocoRead</code> input to <code>translocoPrefix</code>, and the <code>read</code> microsyntax key to <code>prefix</code></td><td>Yes</td></tr><tr><td>Adds <code>provideGlobalTranslateFn()</code> where the standalone <code>translate()</code> / <code>translateObject()</code> functions are used</td><td>Yes</td></tr><tr><td>Angular and rxjs peer dependency floors</td><td>Declared</td></tr><tr><td>Node.js <code>&#x3E;=22</code> for the CLI packages, and the chokidar bump</td><td>Reported</td></tr><tr><td>Keys Manager version line and its Angular / TypeScript floors</td><td>Manual</td></tr></tbody></table>

***

## `translocoRead` is removed

The `translocoRead` input was deprecated in v8 and is gone in v9. Use `translocoPrefix` instead. In the structural form, the `read` microsyntax key becomes `prefix`:

{% code title="Before" %}
```html
<ng-container *transloco="let t; read: 'dashboard'">
  {{ t('title') }}
</ng-container>
```
{% endcode %}

{% code title="After" %}
```html
<ng-container *transloco="let t; prefix: 'dashboard'">
  {{ t('title') }}
</ng-container>
```
{% endcode %}

The migration rewrites both standalone templates and inline `template` strings in your components. Two cases it will not rewrite silently:

* **A template that doesn't parse.** It is logged by path and skipped — such a template is already broken, so there is nothing to migrate in it. Rename it by hand.
* **An element that sets both `translocoPrefix` and `translocoRead`**, where the prefix is an expression or an interpolated value. v8 fell back to the read whenever that prefix evaluated to empty, and only the running app can decide whether it does. The read is dropped and the file is logged — check those by hand.

***

## `translate()` and `translateObject()` need a provider

The standalone `translate()` and `translateObject()` functions are no longer wired up automatically. Add `provideGlobalTranslateFn()` to your root providers:

{% code title="app.config.ts" %}
```typescript
import { provideTransloco, provideGlobalTranslateFn } from '@jsverse/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
      },
      loader: TranslocoHttpLoader,
    }),
    provideGlobalTranslateFn(),
  ],
};
```
{% endcode %}

Without it, `translate()` returns `''` and `translateObject()` returns `[]`, and both warn in development mode. The migration adds the provider for you when it finds the functions imported from `@jsverse/transloco` — detection is anchored on the import rather than on call sites, so a local helper of your own named `translate` is never mistaken for the global one, and an `import type` is correctly ignored.

{% hint style="warning" %}
**Omit `provideGlobalTranslateFn()` in SSR and in multi-instance micro-frontend setups.**\
Both run more than one Transloco instance, and a global function cannot know which one you meant. Inject `TranslocoService` directly there.
{% endhint %}

***

## Dependency floors

Peer dependencies, per package:

<table><thead><tr><th>Package</th><th>Requirement</th></tr></thead><tbody><tr><td>Transloco, Locale, Messageformat</td><td><code>@angular/core &#x3E;=20</code>, <code>rxjs ^6.5.3 || ^7.4.0</code></td></tr><tr><td>Persist Lang, Persist Translations, Preload Langs</td><td><code>@angular/core &#x3E;=20</code></td></tr><tr><td>Keys Manager</td><td><code>@angular/compiler &#x3E;=20</code>, <code>typescript &#x3E;=5.8</code></td></tr></tbody></table>

The Angular floor is declared as a peer range and as a requirement on the migration itself, so `ng update` refuses to run before it touches anything if your workspace doesn't satisfy it.

**Node.js `>=22`** is now required by the CLI packages: `@jsverse/transloco-keys-manager`, `@jsverse/transloco-optimize`, `@jsverse/transloco-scoped-libs`, `@jsverse/transloco-utils` and `@jsverse/transloco-validator`. Node has no equivalent enforcement mechanism, so the migration reads your running version and warns if it is older.

Transloco Scoped Libs also bumped `chokidar` from v3 to v5, which is **ESM-only**.

***

## Keys Manager

`@jsverse/transloco-keys-manager` moved into the main [jsverse/transloco](https://github.com/jsverse/transloco) monorepo and joined the shared version line, so it jumps straight from `8.1.1` to `9.0.0`. Nothing in its CLI or configuration changed — only the version number and the dependency floors above.
