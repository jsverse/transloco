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

<table><thead><tr><th>Change</th><th width="140">Automated?</th></tr></thead><tbody><tr><td>Renames the removed <code>translocoRead</code> input to <code>translocoPrefix</code>, and the <code>read</code> microsyntax key to <code>prefix</code></td><td>Yes</td></tr><tr><td>Adds <code>provideGlobalTranslateFn()</code> where the standalone <code>translate()</code> / <code>translateObject()</code> functions are used</td><td>Yes</td></tr><tr><td>Moves the npm scripts that run <code>transloco-keys-manager</code>, <code>transloco-validator</code>, <code>transloco-optimize</code> and <code>transloco-scoped-libs</code> to the <code>transloco</code> bin, and adds <code>@jsverse/transloco-cli</code> to <code>devDependencies</code></td><td>Yes</td></tr><tr><td>Rewrites the <code>marker</code> imports to <code>@jsverse/transloco-cli/marker</code>, and the <code>TranslocoGlobalConfig</code> and <code>getGlobalConfig</code> imports of <code>@jsverse/transloco-utils</code></td><td>Yes</td></tr><tr><td>Files that still reference the removed Keys Manager and Scoped Libs webpack plugins</td><td>Reported</td></tr><tr><td>CI pipelines, Makefiles, shell scripts, husky hooks, lint-staged configs, Dockerfiles, <code>project.json</code> and <code>angular.json</code> that run the old bins</td><td>Reported, never edited</td></tr><tr><td>Angular and rxjs peer dependency floors</td><td>Declared</td></tr><tr><td>Node.js <code>^22.18.0 || &#x3E;=24</code> for the CLI packages, and the chokidar bump</td><td>Reported</td></tr><tr><td>Keys Manager version line and its Angular / TypeScript floors</td><td>Manual</td></tr></tbody></table>

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

**Node.js `^22.18.0 || >=24`** is now required by the CLI packages: `@jsverse/transloco-cli`, `@jsverse/transloco-keys-manager`, `@jsverse/transloco-optimize`, `@jsverse/transloco-scoped-libs`, `@jsverse/transloco-utils` and `@jsverse/transloco-validator`. Node has no equivalent enforcement mechanism, so the migration reads your running version and warns if it is older.

Transloco Scoped Libs also bumped `chokidar` from v3 to v5, which is **ESM-only**.

***

## Keys Manager

`@jsverse/transloco-keys-manager` moved into the main [jsverse/transloco](https://github.com/jsverse/transloco) monorepo and joined the shared version line, so it jumps straight from `8.1.1` to `9.0.0`. Its commands, options and configuration are unchanged — only the version number and the dependency floors above. The `transloco-keys-manager` bin is deprecated in favour of [`transloco extract` and `transloco find`](../developer-tools/transloco-cli.md), see [Moving to the Transloco CLI](#moving-to-the-transloco-cli).

* `marker` is now imported from `@jsverse/transloco-cli/marker`. `@jsverse/transloco-keys-manager/marker` still works and is deprecated. The package root `@jsverse/transloco-keys-manager` has no entry point anymore, so a `marker` import from it no longer resolves. `ng update` rewrites the imports from both paths.
* `TranslocoExtractKeysWebpackPlugin` is removed, since Angular's default builder no longer uses webpack. There is no replacement that watches: `transloco extract` has no `--watch` option, it extracts once and exits. Run it before your dev server starts, as in `"start": "transloco extract && ng serve"`, and again whenever the keys should be refreshed. `ng update` lists the files that still reference the plugin.

***

## Scoped Libs

`TranslocoScopedLibsWebpackPlugin` (`@jsverse/transloco-scoped-libs/webpack`) is removed, since Angular's default builder no longer uses webpack. All the plugin did was start the watcher, so drop it from your webpack config and run `transloco scoped-libs --watch` yourself, in a second terminal or through a parallel script runner, so that it keeps running at the same time as your dev server. `ng update` lists the files that still reference the plugin.

***

## Moving to the Transloco CLI

v9 adds the [`transloco` command line](../developer-tools/transloco-cli.md) (`@jsverse/transloco-cli`) and deprecates the tools it replaces. The deprecated tools keep working until Transloco v10, and each bin prints a deprecation notice on stderr when it starts. Setting `NODE_OPTIONS=--no-deprecation` silences the notice.

<table><thead><tr><th>Deprecated</th><th>Use instead</th></tr></thead><tbody><tr><td><code>transloco-keys-manager extract</code></td><td><code>transloco extract</code></td></tr><tr><td><code>transloco-keys-manager find</code></td><td><code>transloco find</code></td></tr><tr><td><code>transloco-validator</code></td><td><code>transloco validate</code></td></tr><tr><td><code>transloco-optimize</code></td><td><code>transloco optimize</code></td></tr><tr><td><code>transloco-scoped-libs</code></td><td><code>transloco scoped-libs</code></td></tr><tr><td><code>ng g @jsverse/transloco-schematics:join</code> and <code>split</code></td><td><code>transloco join</code> and <code>transloco split</code></td></tr><tr><td><code>ng g @jsverse/transloco-schematics:ngx-migrate</code> and <code>ng-migrate</code></td><td><code>transloco migrate ngx-translate</code> and <code>transloco migrate angular-i18n</code></td></tr><tr><td><code>marker</code> of <code>@jsverse/transloco-keys-manager/marker</code></td><td><code>marker</code> of <code>@jsverse/transloco-cli/marker</code></td></tr><tr><td><code>getGlobalConfig</code> of <code>@jsverse/transloco-utils</code></td><td><code>getGlobalConfig</code> of <code>@jsverse/transloco-cli</code></td></tr><tr><td><code>TranslocoGlobalConfig</code> of <code>@jsverse/transloco-utils</code></td><td><code>TranslocoGlobalConfig</code> of <code>@jsverse/transloco</code></td></tr></tbody></table>

### What `ng update` does

`ng update @jsverse/transloco` moves the npm scripts that run the old bins to the `transloco` bin, in every `package.json` outside `node_modules`, `dist` and the dot-folders, and adds `@jsverse/transloco-cli` to `devDependencies`. It rewrites the `marker`, `TranslocoGlobalConfig` and `getGlobalConfig` imports as well. The rest of a script stays byte for byte, and options are respelled where they differ: `--commentsKey` of `transloco-optimize` becomes `--comments-key`, and `-m` of `transloco-scoped-libs` becomes `--skip-gitignore`. Options the old command accepted but never read are dropped from the rewritten script: `--output`, `--langs`, `--replace` and `--remove-extra-keys` for `find`, and `--translations-path`, `--add-missing-keys` and `--emit-error-on-extra-keys` for `extract`.

### What `ng update` leaves alone

A script that can't be translated with the same meaning is left as it is and listed with the reason, for example one with an unknown option, a repeated or empty value, a `$VAR` or `$(…)` in the command, or a bin run from inside a quoted argument such as `concurrently "transloco-scoped-libs -w"`.

CI pipelines (GitHub Actions, GitLab, Azure, CircleCI, Bitbucket, Jenkins), Makefiles, shell scripts, husky hooks, lint-staged configs, Dockerfiles, Docker Compose files, Taskfiles, justfiles, `project.json` and `angular.json` that run the old bins are listed and never edited. Change them by hand to the commands in the table.

The old packages stay in `package.json`. Remove them once nothing runs their bins.

### Behaviour differences

* `transloco optimize` exits with code `1` when it fails, where `transloco-optimize` printed the error and exited with `0`. A pipeline that went on after a failed `transloco-optimize` stops now, once its script runs the new bin.
* A `--config` path that does not exist is an error for `transloco extract` and `transloco find`, where the old bin ignored it and went on with the default configuration.
* `transloco validate` checks every file it is given and reports each failing one, where `transloco-validator` stopped at the first.

The `transloco` command line rejects arguments it doesn't understand instead of ignoring them, see [Strict arguments](../developer-tools/transloco-cli.md#strict-arguments).
