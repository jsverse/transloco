---
icon: terminal
---

# Transloco CLI

The `transloco` command line runs all of Transloco's tooling from one package: extracting and checking translation keys, validating and optimizing translation files, copying the translations of scoped libraries, joining and splitting scopes, and migrating a project from another i18n library.

It replaces the separate Keys Manager, Validator, Optimize and Scoped Library Extractor packages, and the `join`, `split`, `ngx-migrate` and `ng-migrate` schematics. Those still work until Transloco v10, see [Moving to the Transloco CLI](../migration-guides/migrate-to-v9.md#moving-to-the-transloco-cli).

## Installation

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add @jsverse/transloco-cli@next --save-dev
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @jsverse/transloco-cli@next --dev
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @jsverse/transloco-cli@next --save-dev
```
{% endtab %}
{% endtabs %}

The package adds the `transloco` command. Run `npx transloco --help` to list the commands, `npx transloco <command> --help` for the options of one of them, and `npx transloco -V` (or `--version`) to print the installed version.

{% hint style="info" %}
The CLI requires Node.js `^22.18.0 || >=24`. `extract` and `find` also need `@angular/compiler` and `typescript`, and `migrate angular-i18n` needs `@angular/compiler`, which every Angular project has. They are optional peer dependencies, so the other commands run without them.
{% endhint %}

***

## Commands

| Command                         | What it does                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `transloco init`                | Prepares a project for the CLI: the config, the translation files and the scripts.   |
| `transloco extract`             | Extracts the translation keys of the sources into the translation files.             |
| `transloco find`                | Reports the keys missing from the translation files and the extra ones in them.      |
| `transloco validate <files...>` | Verifies the translation files are valid JSON without duplicate keys.                |
| `transloco optimize [dist]`     | Flattens and minifies the built translation files, dropping the translator comments. |
| `transloco scoped-libs`         | Copies the translation files of scoped libraries into the application.               |
| `transloco join`                | Joins the translation files of all scopes into one file per language.                |
| `transloco split`               | Splits joined translation files back into the scope folders.                         |
| `transloco migrate`             | Migrates a project to Transloco, from `ngx-translate` or from the Angular `i18n`.    |

***

## init

```bash
transloco init
```

Prepares a project for the CLI. It writes `transloco.config.ts` in the working directory, creates the translation files that don't exist yet and adds the `i18n:extract` and `i18n:find` scripts to `package.json`. It installs nothing and changes no source code. The config is the same one `ng add @jsverse/transloco` generates, holding `rootTranslationsPath` and `langs`, and each new translation file is `{}` until `transloco extract` fills it.

In a terminal it asks for what the options didn't give: the languages (separated by spaces or commas, `en` unless you type others), the translations folder (the one `ng add` picks, see below), whether to create the missing translation files and whether to add the scripts. Nothing is written before the last question is answered, and cancelling with Ctrl-C or Esc writes nothing and exits with `130`.

To skip the questions, for example in a script, pass `--yes`:

```bash
transloco init --yes --langs en es --translations-path projects/shop/src/assets/i18n
```

The folder `ng add` picks is `public/i18n` when there is a `public` folder (the Angular 18+ layout), `<source root>/assets/i18n` when the source root of the default project has an `assets` folder, and else `public/i18n` from Angular 18 on, by the `@angular/core` version in `package.json`, and `<source root>/assets/i18n` before. When the workspace has several projects, or none that `extract` finds without `--project`, the closing line names them.

Without a terminal and without `--yes` the command exits with `1`, as there is nobody to ask.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--langs</code></td><td><code>-l</code></td><td>The languages of the project, as separate arguments: <code>--langs en es</code>. Asked for in a terminal when left out.</td><td><code>string[]</code></td><td><code>en</code></td></tr><tr><td><code>--translations-path</code></td><td>-</td><td>The folder of the translation files, which has to be inside the working directory. Asked for in a terminal when left out.</td><td><code>string</code></td><td>The folder <code>ng add</code> picks, see above</td></tr><tr><td><code>--no-scripts</code></td><td>-</td><td>Leaves <code>package.json</code> alone.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--yes</code></td><td><code>-y</code></td><td>Asks nothing and takes the defaults for what the options did not give.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--force</code></td><td>-</td><td>Overwrites an existing <code>transloco.config.ts</code>.</td><td><code>boolean</code></td><td><code>false</code></td></tr></tbody></table>

An existing translation file is never touched, and neither is an existing script of the same name: both are kept and reported as such. An existing `transloco.config.ts` is refused unless you pass `--force`. A Transloco config anywhere else, such as another file name or the `transloco` key of `package.json`, is always refused, as a second one would make it ambiguous which applies. Nothing is written unless everything can be: if a file can't be written, the command exits with `1` and one line naming the file.

***

## extract

Extracts the translation keys of your templates and TypeScript files into the translation files, one file per language. See [Keys Extractor](keys-manager-tkm/keys-extractor.md) for what is detected, including scopes, dynamic keys and the marker function.

```bash
transloco extract --input src/app --output src/assets/i18n --langs en es
```

Write the languages as separate arguments, `--langs en es`. A comma inside a value (`--langs en,es`) is rejected, as it would be one language named `en,es`. An option that is not on the command line is taken from the [config file](#config-file) (the `keysManager` block, `langs`, and `rootTranslationsPath`, which gives `--output` of `extract` and `--translations-path` of `find` their default) and else from its default.

The files are read in a sorted order, so the keys of an extracted file come out in the same order on every machine. The first `extract` after upgrading may reorder the keys of your existing files once.

With `--project`, a config at the workspace root whose `rootTranslationsPath` is outside the project (the one `ng add` writes for the first project) is not used for the output: `extract` writes to `<source root>/assets/i18n` of the project instead, so as not to write into the translations of another project, and says so on stderr. `find --project` reads the same folder. A `--project` the workspace doesn't know is an error that lists the projects. A `rootTranslationsPath` that doesn't exist yet is pointed out on stderr, along with the folder its path is relative to: the working directory, or the folder of a config found above it.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--project</code></td><td>-</td><td>The project whose source root and type give the defaults of the other options.</td><td><code>string</code></td><td>The default project of <code>angular.json</code> (or <code>.angular.json</code>), <code>workspace.json</code> or <code>project.json</code>, or else the first one. Source root <code>src</code> without any</td></tr><tr><td><code>--config</code></td><td><code>-c</code></td><td>A config file, or a folder to look for one in, instead of the lookup described under Config file. It has to exist.</td><td><code>string</code></td><td>Looked up in the source root of the project and its parent folders, see Config file</td></tr><tr><td><code>--input</code></td><td><code>-i</code></td><td>The folders holding the sources. Several go into this one option, separated by commas.</td><td><code>string</code></td><td><code>&#x3C;source root&#x3E;/app</code>, and <code>&#x3C;source root&#x3E;/lib</code> for a library</td></tr><tr><td><code>--output</code></td><td><code>-o</code></td><td>The folder the translation files are written to.</td><td><code>string</code></td><td><code>keysManager.output</code> of the config, then the translations folder of the config (<code>rootTranslationsPath</code>, or <code>keysManager.translationsPath</code> when set), then <code>&#x3C;source root&#x3E;/assets/i18n</code></td></tr><tr><td><code>--langs</code></td><td><code>-l</code></td><td>The languages to generate, as separate arguments: <code>--langs en es</code>.</td><td><code>string[]</code></td><td><code>en</code></td></tr><tr><td><code>--file-format</code></td><td><code>-f</code></td><td>The format of the translation files, <code>json</code> or <code>pot</code>.</td><td><code>string</code></td><td><code>json</code></td></tr><tr><td><code>--marker</code></td><td><code>-m</code></td><td>The marker sign for dynamic values.</td><td><code>string</code></td><td><code>t</code></td></tr><tr><td><code>--sort</code></td><td><code>-s</code></td><td>Sorts the keys.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--unflat</code></td><td><code>-u</code></td><td>Writes the translation files unflattened.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--default-value</code></td><td><code>-d</code></td><td>The value of a new key. <code>{{key}}</code>, <code>{{keyWithoutScope}}</code>, <code>{{params}}</code> and <code>{{scope}}</code> are replaced.</td><td><code>string</code></td><td><code>Missing value for '&#x3C;key&#x3E;'</code></td></tr><tr><td><code>--replace</code></td><td><code>-r</code></td><td>Replaces the content of an existing translation file with the extracted keys instead of merging them.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--remove-extra-keys</code></td><td><code>-R</code></td><td>Removes the keys that are no longer in the sources from the existing translation files.</td><td><code>boolean</code></td><td><code>false</code></td></tr></tbody></table>

`extract` has no watch mode, it extracts once and exits. To keep the files fresh while you develop, run it before the dev server starts, as in `"start": "transloco extract && ng serve"`.

***

## find

Reports the keys that are used in the sources but missing from the translation files, and the keys in the translation files that are no longer used. See [Keys Detective](keys-manager-tkm/keys-detective.md).

```bash
transloco find --translations-path src/assets/i18n --emit-error-on-extra-keys
```

It exits with `1` when keys are missing, unless `--add-missing-keys` adds them, and with `2` when `--emit-error-on-extra-keys` is set and extra keys were found. That makes it usable as a check in a CI pipeline.

`find` takes `--project`, `--config`, `--input`, `--marker`, `--sort`, `--unflat` and `--default-value` like `extract` does, with the same defaults, and the config is looked up the same way. `--sort` and `--default-value` change what `--add-missing-keys` writes. Only files named exactly `<lang>.json` are read as translation files, so a file like `es.vendor.json` next to them is ignored. `find` works with `json` translation files only: with `--file-format` set to another format, such as `pot`, it fails with `find supports only json translation files, not "pot"` and exits with `1`. Its own options:

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--translations-path</code></td><td><code>-p</code></td><td>The folder of the main translation files.</td><td><code>string</code></td><td><code>keysManager.translationsPath</code> of the config, then <code>rootTranslationsPath</code>, then <code>&#x3C;source root&#x3E;/assets/i18n</code></td></tr><tr><td><code>--add-missing-keys</code></td><td><code>-a</code></td><td>Adds the missing keys to the translation files.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--emit-error-on-extra-keys</code></td><td><code>-e</code></td><td>Exits with <code>2</code> when extra keys were found.</td><td><code>boolean</code></td><td><code>false</code></td></tr></tbody></table>

***

## validate

Verifies that translation files are valid JSON and hold no duplicate keys. See [Validator](validator.md) for pre-commit and CI setups.

```bash
transloco validate src/assets/i18n/en.json src/assets/i18n/es.json
```

It checks every file it is given, prints one line per invalid file and exits with `1` when there is any. It takes no options besides `--help`.

***

## optimize

Flattens and minifies the translation files of a production build, and drops the translator comments. See [Optimize](optimize.md).

```bash
transloco optimize dist/my-app/browser/assets/i18n --comments-key note
```

Every `.json` file below the folder, at any depth, is optimized in place, not only the translation files, so point it at the translations folder and nothing wider. It exits with `1` when there is nothing to optimize or when a file can't be processed.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>[dist]</code></td><td><code>--dist, -d</code></td><td>The folder holding the built translation files. Give it as the argument or with the option, one of the two is required and both is an error.</td><td><code>string</code></td><td>-</td></tr><tr><td><code>--comments-key</code></td><td><code>-k</code></td><td>The key the translator comments are kept under in the translation files, so that they are dropped.</td><td><code>string</code></td><td><code>comment</code></td></tr></tbody></table>

***

## scoped-libs

Copies the translation files of scoped libraries into the application. It reads `rootTranslationsPath` and `scopedLibs` of the [config file](#config-file). See [Scoped Library Extractor](scoped-library-extractor.md) for how to set a library up.

```bash
transloco scoped-libs --watch --config configs/transloco.config.js
```

Every library is copied, also when one before it is misconfigured (without `src`, a `package.json` or an `i18n` entry in it, or a folder to copy to). Each problem is reported on stderr, and the command exits with `1` once the others are copied. With `--watch` it reports them and keeps watching the other libraries, and exits with `1` when none of them could be watched. A config without `scopedLibs`, or with an empty list, is an error too.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--watch</code></td><td><code>-w</code></td><td>Keeps running and copies the files as they change.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--skip-gitignore</code></td><td>-</td><td>Doesn't add the copied translation files to <code>.gitignore</code>.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--config</code></td><td><code>-c</code></td><td>A config file, or a folder to look for one in, instead of the working directory. It has to exist.</td><td><code>string</code></td><td>Looked up in the working directory</td></tr></tbody></table>

***

## join

Merges the translation files of every scope into the root file of the same language and writes one file per language.

```bash
transloco join --translations-path src/assets/i18n --default-lang en --out-dir dist-i18n
```

A scope is a folder of the translations root, or a folder of the `scopePathMap` of the config. A scope folder nested in another one is stored under a dotted key beside its parent, such as `admin.users` for `admin/users`, and `split` restores it. The default language is left out unless you pass `--include-default-lang`, and the command exits with `1` when that leaves nothing to join, which is when only the default language is found. Without a default language, from the flag or the config, there is nothing to leave out and every language is joined, with or without `--include-default-lang`.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--translations-path</code></td><td>-</td><td>The folder of the root translation files.</td><td><code>string</code></td><td><code>rootTranslationsPath</code> of the config</td></tr><tr><td><code>--out-dir</code></td><td><code>-o</code></td><td>The folder the joined files are written to. It is emptied first.</td><td><code>string</code></td><td><code>dist-i18n</code></td></tr><tr><td><code>--default-lang</code></td><td>-</td><td>The default language of the project.</td><td><code>string</code></td><td><code>defaultLang</code> of the config</td></tr><tr><td><code>--include-default-lang</code></td><td>-</td><td>Joins the default language as well. It is left out otherwise.</td><td><code>boolean</code></td><td><code>false</code></td></tr><tr><td><code>--config</code></td><td><code>-c</code></td><td>A config file, or a folder to look for one in, instead of the working directory. It has to exist.</td><td><code>string</code></td><td>Looked up in the working directory</td></tr></tbody></table>

The out folder is emptied first, so it has to be inside the working directory and not overlap the translations. It does not have to exist, it is created. The command refuses to run, and changes nothing, when the out folder is the working directory or a folder above it, a folder outside of it, a symbolic link, a file, or the translations root or a scope folder or a folder above or below one. Only `.json` files count as translations, and in the root and the scope folders a translation file is named exactly `<lang>.json` (a file like `es.vendor.json` is left alone). It refuses an out folder that holds anything but `.json` files, as it is emptied first. It also exits with `1` when the root doesn't exist or holds no translation file, when two files define the same key, or when a file it reads is not valid JSON. The files of the default language are not read when it is left out, so an invalid one doesn't stop the command.

***

## split

Hands the translations of every scope in the joined files back to the files of its scope folder, and what is left to the root file of the language.

```bash
transloco split --translations-path src/assets/i18n --source dist-i18n
```

Only the files that exist are written, none is created, and only files named exactly `<lang>.json` are read. The scopes are found the way `join` finds them, so `join` followed by `split` leaves every file as it was. It exits with `1`, and writes nothing, when the root or the source doesn't exist or holds no translation file, or when a joined file is not valid JSON.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--translations-path</code></td><td>-</td><td>The folder of the root translation files.</td><td><code>string</code></td><td><code>rootTranslationsPath</code> of the config</td></tr><tr><td><code>--source</code></td><td>-</td><td>The folder holding the joined translation files.</td><td><code>string</code></td><td><code>dist-i18n</code></td></tr><tr><td><code>--config</code></td><td><code>-c</code></td><td>A config file, or a folder to look for one in, instead of the working directory. It has to exist.</td><td><code>string</code></td><td>Looked up in the working directory</td></tr></tbody></table>

***

## migrate

`migrate` has one command per library to migrate from. Both rewrite the files of your project in place, so commit your work first and go through the diff afterwards, as they only read the marks and names they know. They leave out the folders of tools and builds below `--input` (`node_modules`, `dist`, `out-tsc`, `coverage`, `.angular`, `.nx` and hidden folders), and a symlink below it that points outside of it.

### migrate ngx-translate

```bash
transloco migrate ngx-translate --input src/app
```

Rewrites the HTML and TypeScript files below `--input`: the `translate` directive (`[translate]="'KEY'"` and `[translateParams]` too) and pipe, in the template files and in the inline templates of the components, the `TranslateModule`, the `TranslateService` with its injection, by the constructor or by `inject()` under any name, and its calls, and the `TranslatePipe`, all for their Transloco counterparts. A `get()` becomes `selectTranslate().pipe(take(1))`, with `take` imported from `rxjs/operators`, which works with rxjs 6 and 7. The ngx-translate imports become one `@jsverse/transloco` import, and a symbol without a counterpart, such as `LangChangeEvent`, keeps its ngx-translate import. Declaration files are left out. In the spec files the imports and injections are renamed to `TranslocoService`, but the service calls are left as they are, so fix them by hand. What it can't migrate is left as it is and printed with its file and line: a call of the service without a counterpart (`set()`, `addLangs()`, `getLangs()`, `onTranslationChange`…), a leftover `LangChangeEvent` (`onLangChange` becomes `langChanges$`, which emits the language string), a `translate` attribute without a value (`<span translate>KEY</span>`), and an inline template it can't read (an interpolation, a concatenation or a variable), for which the file keeps its ngx-translate imports so that it isn't half migrated (the templates of the other components in that file are still migrated). A few steps are left to you afterwards, see [Migrate from ngx-translate](../migration-guides/migrate-from-ngx-translate.md). It exits with `1` when the input doesn't exist or holds no `.html` or `.ts` file.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--input</code></td><td><code>-i</code></td><td>The folder holding the files to migrate.</td><td><code>string</code></td><td><code>src/app</code></td></tr></tbody></table>

### migrate angular-i18n

```bash
transloco migrate angular-i18n --input src/app --langs en es
```

Replaces the marked text of the HTML templates below `--input` with the `transloco` pipe, and adds the texts to one translation file per language of `--langs`. A translation file that exists keeps its keys and their values, and gets the keys it lacks after them, in sorted order; one that isn't a JSON object stops the migration before anything is written, and no file is written when no mark is found. A key is the custom id of the mark as it's written (`@@myId` is `myId`). A mark without one gets a key made of its text: the camelCase words and the spaces and underscores become dashes, all in lower case, without the characters that can't stand in a template string (`'"` `` ` `` `\<>&{}`), and with no repeated, leading or trailing dash (`Hello World` is `hello-world`). A key with a meaning goes below it, and the template reads it as `meaning.key`, and a description is kept as the comment of the key (`key.comment`). When a key comes twice with different texts, the first in path order is kept and the other is printed with both files and lines. A marked attribute (`i18n-title`) is bound to the pipe: `[title]="'key' | transloco"`, and `translate="no"` is preserved. A mark the migration can't convert is left in place and printed with its file and line: one on an element without a text, around other elements, with an interpolation, or with an ICU message and no custom id. The templates are parsed with `@angular/compiler`, which has to be installed. See [Migrate from Angular's i18n](../migration-guides/migrate-from-angulars-i18n.md). It exits with `1` when the input doesn't exist or holds no `.html` file.

<table data-header-hidden><thead><tr><th></th><th width="100"></th><th></th><th width="112"></th><th></th></tr></thead><tbody><tr><td><strong>Option</strong></td><td><strong>Alias</strong></td><td><strong>Description</strong></td><td><strong>Type</strong></td><td><strong>Default</strong></td></tr><tr><td><code>--input</code></td><td><code>-i</code></td><td>The folder holding the templates to migrate.</td><td><code>string</code></td><td><code>src/app</code></td></tr><tr><td><code>--langs</code></td><td><code>-l</code></td><td>The languages to create a translation file for, as separate arguments. Required.</td><td><code>string[]</code></td><td>-</td></tr><tr><td><code>--translations-path</code></td><td>-</td><td>The folder the translation files are written to. It has to lie inside the working directory.</td><td><code>string</code></td><td><code>rootTranslationsPath</code> of the config, then <code>public/i18n</code> when a <code>public</code> folder exists, else <code>&lt;source root&gt;/assets/i18n</code></td></tr><tr><td><code>--config</code></td><td><code>-c</code></td><td>A config file, or a folder to look for one in, instead of the working directory. It has to exist.</td><td><code>string</code></td><td>Looked up in the working directory</td></tr></tbody></table>

`migrate ngx-translate` rewrites the templates and the TypeScript sources; `migrate angular-i18n` rewrites the templates and writes or merges the translation files. A few steps are left to you afterwards:

- Set up Transloco: `provideTransloco()` (or `TranslocoModule` and its providers) with your languages, and a `TranslocoLoader` that loads the translation files, in place of `provideTranslateService()`, `TranslateModule.forRoot()` and their loader. `ng add @jsverse/transloco@next` writes both.
- Import `TranslocoPipe` or `TranslocoDirective` (or `TranslocoModule`) where a template uses them. `migrate ngx-translate` renames the ngx-translate imports it finds, while `migrate angular-i18n` adds no import, so every standalone component or module with a converted template needs `TranslocoPipe` added to its `imports`.
- Go through what the migration printed, and translate the texts it left by hand.

***

## Config file

`ng add @jsverse/transloco` writes a `transloco.config.ts` to the root of your workspace and `transloco init` to the working directory, and the commands read their defaults from it. See [Global Config](global-config.md) for everything it can hold.

Without `--config`, `extract` and `find` look for the config in the source root of the project first, then in each parent directory up to the working directory, and use the first one they find, so the config at the workspace root is found. When the working directory has no `package.json`, as with `--cwd apps/shop`, the search goes on upward to the first directory that has one, which is the root of the repository, and stops there. The relative paths of a config found above the working directory are taken from the folder of the config, so the root config, whose paths start at the root, works from `--cwd apps/shop` as well. The paths of any other config, and of every config named with `--config`, are relative to the working directory.

`--config` names the one file, or the one directory, to read, and nothing else is searched. The path has to exist. A directory is searched for a config and has to hold one, the command exits with `1` otherwise. A config that fails to load, because of a syntax error or an exception when it is imported, stops the command with exit code `1` and one line naming the file and the reason.

`transloco init` runs the same search to check that the project has no config yet, and refuses to write a second one.

The other commands that read the config (`scoped-libs`, `join`, `split` and `migrate angular-i18n`) don't walk through the source root and the parent folders. Without `--config` they look for it in the working directory alone, and `--config` names the file, or the directory, to read instead.

***

## Marker function

Some keys are not read by a translate call, for example the keys of a static list of labels. Wrap them with `marker` so that `extract` and `find` pick them up:

{% code title="titles.ts" %}
```typescript
import { marker } from '@jsverse/transloco-cli/marker';

const key = marker('dashboard.title');
```
{% endcode %}

`marker` returns the key as it is. Its optional second argument is not used, and the third is the scope of the key. `@jsverse/transloco-keys-manager/marker` still works and is deprecated.

***

## Strict arguments

A command line either runs with everything that was typed, or it is rejected with exit code `1` before anything is written. It never runs with a value that went somewhere else. These are the rules you will meet most often.

**A command rejects the options it doesn't read.** A typo or the flag of another command fails the run instead of being ignored. A `transloco.config` file can still hold the options of every command.

```bash
# Wrong: --translations-path belongs to find, extract has --output
transloco extract --translations-path src/assets/i18n

# Right
transloco extract --output src/assets/i18n
```

**Folders go into one `--input`, languages are separate arguments.** An option that takes a single value can be given once, so several source folders are separated by commas inside it. `--langs` is the opposite, it takes several arguments and rejects a comma separated list.

```bash
# Wrong: --input twice, and one language named "en,es"
transloco extract --input src/app --input src/lib --langs en,es

# Right
transloco extract --input src/app,src/lib --langs en es
```

**An option that needs a value doesn't take another option for it.** `--config --sort` reports the value of `--config` as missing. A value that really starts with a dash is attached with `=`.

```bash
# Wrong: -R is read as an option
transloco extract --default-value -R

# Right
transloco extract --default-value=-R
```

**A short option is one dash and one letter.** Its value is the next argument, and `=` goes with the long form. Letters without a value can share one dash, as in `-su`.

```bash
# Wrong
transloco extract -cconfigs/transloco.config.ts
transloco extract -c=configs/transloco.config.ts

# Right
transloco extract -c configs/transloco.config.ts
transloco extract --config=configs/transloco.config.ts
```

**A value can't be empty, and a `--config` path has to exist.** An empty `--default-value` is the one exception, an empty default value is a valid choice.

Asking for help comes before all of it: `--help` or `-h` anywhere before `--` prints the help of the command it follows and exits with `0`, whatever else is wrong with the line.

***

## Running from another directory

`--cwd` (or `-C`) goes before the command and makes it run as if `transloco` was started in that directory:

```bash
transloco --cwd apps/shop extract
```
