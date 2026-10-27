# Transloco CLI

The unified `transloco` command line for Transloco's tooling. Discover more in the [official Transloco documentation](https://jsverse.gitbook.io/transloco/).

## Usage

```bash
npm install --save-dev @jsverse/transloco-cli
npx transloco --help
```

Every command has its own `--help`.

### Strict by design

A command line either runs with everything that was typed or it is rejected with exit code 1 before anything is written. It never runs with a value that went somewhere else.

- A command rejects the options it doesn't read, so a typo or a flag of another command fails the run instead of being ignored. That only goes for the command line: a `transloco.config` file may hold the options of every command.
- An option taking a single value can be given once. Several source directories go into one `--input`, separated by commas.
- A value can't be empty or blank. `--default-value` is the exception: an empty default value is a valid choice.
- An option that needs a value doesn't take another option for it: `--config --sort` reports the value of `--config` as missing. To pass a value that really starts with a dash, attach it with `=`: `--default-value=-R`.
- A short option is one dash and one letter. When it takes a value, the value is the next argument (`-c path`); `=` goes with the long form (`--config=path`). Several letters behind one dash are flags and nothing else (`-su`), so a value glued to its option (`-cpath`, `-c=path`), an option taking a value inside a cluster (`-sc path`) and a long option written with one dash (`-output`) are all rejected.
- A `--config` path has to exist. It may be a directory, which is then searched for a config.
- A `--project` has to be a project of the workspace: a project of `angular.json`, `.angular.json` or `workspace.json`, or a `project.json` that has its name or is in a folder of that name. The error lists the projects there are.

Asking for the help is the one thing that comes before all of it. A help request anywhere before `--` prints the help and exits with code 0, ahead of the version and of any other argument error, and nothing runs: `transloco extract --frobnicate -h` and `transloco -V -h` both print the help. A request is `--help`, `-h`, or the letter among flags behind one dash (`-sh`), and it gets the help of the command it follows. That is the program when it stands before the command, or when what precedes it doesn't name one (`transloco translate -h`, `transloco --frobnicate extract -h`). What only looks like one stays what it is: the value in `--default-value=-h`, whatever comes after `--`, and the letter next to anything but flags (`-hc`, `-h=1`). The same goes one level down: `transloco migrate ngx-translate -h` and `transloco help migrate ngx-translate` print the help of `ngx-translate`, while `transloco migrate -h ngx-translate` prints the one of `migrate`.

| Command                         | What it does                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `transloco extract`             | Extracts the translation keys of the sources into the translation files.             |
| `transloco find`                | Reports the keys missing from the translation files and the extra ones in them.      |
| `transloco validate <files...>` | Verifies the translation files are valid JSON without duplicate keys.                |
| `transloco optimize [dist]`     | Flattens and minifies the built translation files, dropping the translator comments. |
| `transloco scoped-libs`         | Copies the translation files of scoped libraries into the application.               |
| `transloco join`                | Joins the translation files of all scopes into one file per language.                |
| `transloco split`               | Splits joined translation files back into the scope folders.                         |
| `transloco migrate`             | Migrates a project to Transloco, from `ngx-translate` or from the Angular `i18n`.    |
| `transloco init`                | Prepares a project for the CLI: the config, the translation files and the scripts.   |

### extract

```bash
transloco extract --input src/app --output src/assets/i18n --langs en es
```

The languages are separate arguments, `--langs en es`. A comma inside a value (`--langs en,es`) is rejected with exit code `1`, as it would be one language named `en,es` and write a file of that name. Only what is typed on the command line is checked: `langs` in the config file is taken as it is.

`extract` and `find` need `@angular/compiler` and `typescript`, and `migrate angular-i18n` needs `@angular/compiler`, which every Angular project has. They are optional peer dependencies, so the other commands run without them.

Without `--project`, the default project of the workspace gives the source root, or else its first one, and `src` when the workspace configs have none, as in an Nx workspace without a root project. When the sources aren't found there, the error lists the projects of the workspace to pick from with `--project`.

Without `--config`, `extract` and `find` look for the config in the source root of the project first, then in each parent directory up to the working directory, and use the first one they find, so the `transloco.config.ts` that `ng add` and `transloco init` write to the workspace root is found. A source root outside of the working directory is followed by the working directory. When the working directory has no `package.json`, as with `--cwd apps/shop`, the search goes on upward to the first directory that has one, which is the root of the repository, and stops there. The relative paths of a config found above the working directory are taken from the folder of the config, so the root config, whose paths start at the root, works from `--cwd apps/shop` as well. The paths of any other config, and of every config named with `--config`, are relative to the working directory, as they were in v8. Without a `package.json` above, or when the working directory has its own, nothing above the working directory is searched. `--config` names the one file, or the one directory, to read, and nothing else is searched. A config that fails to load (a syntax error, an exception when it is imported) stops the command with `1` and one line naming the file and the reason, whether it was found or named with `--config`.

### find

```bash
transloco find --translations-path src/assets/i18n --emit-error-on-extra-keys
```

Exits with `1` when keys are missing, unless `--add-missing-keys` adds them, and with `2` when `--emit-error-on-extra-keys` is set and extra keys were found.

### validate

```bash
transloco validate src/assets/i18n/en.json src/assets/i18n/es.json
```

Prints one line per invalid file and exits with `1` when there is any.

### optimize

```bash
transloco optimize dist/my-app/browser/assets/i18n --comments-key note
```

Exits with `1` when there is nothing to optimize or a file can't be processed.

### scoped-libs

```bash
transloco scoped-libs --watch --config configs/transloco.config.js
```

### join

```bash
transloco join --translations-path src/assets/i18n --default-lang en --out-dir dist-i18n
```

Merges the translation files of every scope into the root file of the same language and writes one file per language to the out folder, `dist-i18n` unless `--out-dir` says otherwise. A scope is a folder of the translations root, or a folder of the `scopePathMap` of the config. A scope folder nested in another one is stored under a dotted key beside its parent, such as `admin.users` for `admin/users`, and `split` restores it. The default language is left out unless `--include-default-lang` is set, and the command stops with `1` when that leaves nothing to join, which is when only the default language is found. Without a default language, from the flag or the config, there is nothing to leave out and every language is joined, with or without `--include-default-lang`.

The root is `--translations-path`, then `rootTranslationsPath` of the config, and the default language is `--default-lang`, then `defaultLang` of the config. The out folder is emptied first, so it has to be inside the working directory and not overlap the translations. It does not have to exist, it is created. The command refuses to run when it is the working directory or a folder above it, a folder outside of it, a symbolic link or a folder reached through one that leads out, a file, or the translations root or a scope folder, or a folder above or below one. Links are followed before any of this is judged, and nothing is changed when the folder is refused. Only `.json` files count as translations. Exits with `1` when the root doesn't exist or holds no translation file, when two files define the same key or a file it reads is not valid JSON, and nothing is written. The files of the default language are not read when it is left out, so an invalid one doesn't stop the command.

### split

```bash
transloco split --translations-path src/assets/i18n --source dist-i18n
```

Hands the translations of every scope in the joined files, `dist-i18n` unless `--source` says otherwise, back to the files of its folder, and what is left to the root file of the language. Only the files that exist are written, none is created. The root comes from `--translations-path` or `rootTranslationsPath` of the config, and the scopes are found the way `join` finds them. A scope folder nested in another one, at any depth, gets back the dotted key `join` stored it under, such as `admin.users`, so that `join` followed by `split` leaves every file as it was. Exits with `1` when the root or the source doesn't exist or holds no translation file, or a joined file is not valid JSON, and nothing is written.

### migrate

`migrate` has one command per library to migrate from. Both rewrite the files of your project in place, so commit your work first. They leave out the folders of tools and builds below `--input` (`node_modules`, `dist`, `out-tsc`, `coverage`, `.angular`, `.nx` and hidden folders), and a symlink below it that points outside of it.

```bash
transloco migrate ngx-translate --input src/app
```

Rewrites the HTML and TS files below `--input`, `src/app` unless it says otherwise: the `translate` directive (`[translate]="'KEY'"` and `[translateParams]` too) and pipe, in the template files and in the inline templates of the components, the `TranslateModule`, the `TranslateService` with its injection, by the constructor or by `inject()` under any name, and its calls, and the `TranslatePipe`, all for their Transloco counterparts. A `get()` becomes `selectTranslate().pipe(take(1))`, with `take` imported from `rxjs`. The ngx-translate imports become one `@jsverse/transloco` import, and a symbol without a counterpart, such as `LangChangeEvent`, keeps its ngx-translate import. Declaration files are left out, and the injections and calls of the spec files are left as they are. What it can't migrate is left as it is and printed with its file and line: a call of the service without a counterpart (`set()`, `addLangs()`, `getLangs()`, `onTranslationChange`…), a `translate` attribute without a value (`<span translate>KEY</span>`), and an inline template it can't read (an interpolation, a concatenation or a variable), for which the component keeps its ngx-translate pipe, directive and module so that it isn't half migrated. See the [list of replacements](https://github.com/jsverse/transloco/blob/master/libs/transloco-schematics/src/ngx-migrate/ngx-translate-migration.md). Exits with `1` when the input doesn't exist or holds no `.html` or `.ts` file.

```bash
transloco migrate angular-i18n --input src/app --langs en es
```

Replaces the marked text of the HTML templates below `--input`, `src/app` unless it says otherwise, with the `transloco` pipe, and adds the texts to one translation file per language of `--langs`. The files go to `--translations-path`, which must lie inside the working directory, then `rootTranslationsPath` of the config (`--config` names another one), then `src/assets/i18n`. A translation file that exists keeps its keys and their values, and gets the keys it lacks after them; one that isn't a JSON object stops the migration before anything is written, and no file is written when no mark is found. A key is the custom id of the mark as it's written (`@@myId` is `myId`). A mark without one gets a key made of its text: the camelCase words and the spaces and underscores become dashes, all in lower case, without the characters that can't stand in a template string (`'"` `` ` `` `\<>&{}`), and with no repeated, leading or trailing dash (`Hello World` is `hello-world`). A key with a meaning goes below it, and the template reads it as `meaning.key`, and a description is kept as the comment of the key (`key.comment`). When a key comes twice with different texts, the first in path order is kept and the other is printed with both files and lines. A marked attribute (`i18n-title`) is bound to the pipe: `[title]="'key' | transloco"`. A mark the migration can't convert is left in place and printed with its file and line: one on an element without a text, around other elements, with an interpolation, or with an ICU message and no custom id. The templates are parsed with `@angular/compiler`, which has to be installed. Exits with `1` when the input doesn't exist or holds no `.html` file.

Both migrations only rewrite the templates and the sources, so a few steps are left to you afterwards:

- Set up Transloco: `provideTransloco()` (or `TranslocoModule` and its providers) with your languages, and a `TranslocoLoader` that loads the translation files, in place of `provideTranslateService()`, `TranslateModule.forRoot()` and their loader. `ng add @jsverse/transloco` writes both.
- Import `TranslocoPipe` or `TranslocoDirective` (or `TranslocoModule`) where a template uses them. `migrate ngx-translate` renames the ngx-translate imports it finds, while `migrate angular-i18n` adds no import, so every standalone component or module with a converted template needs `TranslocoPipe` added to its `imports`.
- Go through what the migration printed, and translate the texts it left by hand.

Both migrations only read the marks and the names they know, so go through the diff before you keep it. They replace the `ng g @jsverse/transloco:ngx-migrate` and `ng g @jsverse/transloco:ng-migrate` schematics, which are deprecated.

### init

```bash
transloco init
```

Prepares a project for the CLI. It writes `transloco.config.ts` in the working directory, creates the translation files that don't exist yet and adds the `i18n:extract` and `i18n:find` scripts to `package.json`. It installs nothing and changes no source code. The config is the one `ng add @jsverse/transloco` generates, holding `rootTranslationsPath` and `langs`, and each translation file is `{}` until `transloco extract` fills it.

In a terminal it asks for what the options didn't give: the languages (separated by spaces or commas, `en` unless you type others), the translations folder (the one `ng add` picks, see below), whether to create the missing translation files and whether to add the scripts. Nothing is written before the last question is answered, and cancelling one with Ctrl-C or Esc writes nothing and exits with `130`.

```bash
transloco init --yes --langs en es --translations-path projects/shop/src/assets/i18n
```

`--yes` (`-y`) asks nothing and takes the defaults for what the options didn't give: `en`, the translations folder `ng add` picks, the missing translation files created and the scripts added. That folder is `public/i18n` when there is a `public` folder (the Angular 18+ layout), `<source root>/assets/i18n` when the source root of the default project has an `assets` folder, and else `public/i18n` from Angular 18 on, by the `@angular/core` version in `package.json`, and `<source root>/assets/i18n` before. When the workspace has several projects, or none that `extract` finds without `--project`, the closing line names them. Without a terminal and without `--yes` the command exits with `1`, as there is nobody to ask.

| Option                      | Meaning                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `-l, --langs <langs...>`    | The languages, as separate arguments: `--langs en es`. A comma separated list is rejected. |
| `--translations-path <dir>` | The folder of the translation files, which has to be inside the working directory.         |
| `--no-scripts`              | Leaves `package.json` alone.                                                               |
| `-y, --yes`                 | Asks nothing and takes the defaults.                                                       |
| `--force`                   | Overwrites an existing `transloco.config.ts`.                                              |

An existing translation file is never touched, and neither is a script of the same name: both are kept and reported as such. `package.json` keeps its indentation, line endings, key order and final line break, and the command stops with `1`, before writing anything, when it is not valid JSON or cannot take a `scripts` object. A `package.json` that is a symbolic link gets the scripts through the link when it leads to a file inside the working directory, and is left alone, with a line saying so, when it leads anywhere else.

An existing `transloco.config.ts` is refused unless `--force` is passed. A Transloco config anywhere else (another file name, the `transloco` key of `package.json`) is always refused, as a second one would make it ambiguous which applies. That check is the search `extract` makes: the config files the CLI itself reads, in the source root of the project first (`src` unless the workspace says otherwise), then in each folder up to the working directory, and further up to the first folder with a `package.json` only when the working directory has none. A config in `src` therefore counts as an existing one, and a config above a folder with no `package.json` anywhere does not. A `transloco.config.ts` that is a symbolic link is written through when it leads to a file inside the working directory, and refused when it leads anywhere else. A file it can't read (a `package.json` that isn't valid JSON, or with a BOM, or that can't be opened, or a config that throws when it is loaded) stops the command with `1` and a line naming the file and the reason. So does a FIFO, a socket or a device where `package.json`, `transloco.config.ts` or a translation file goes, as opening one would wait forever.

Nothing is written unless everything can be: before the first file is written `init` checks that the translations folder is a folder, or can be made one, inside the working directory, and that every file it is about to create or change can be written, which is not the case for a read-only file or folder or a file standing where a folder should be. The command then stops with `1` and one line naming the file. In a terminal, the question about the folder rejects an answer that can't be used and asks again. Should the file system fail anyway while writing, `init` undoes what it did: the files and folders it created are removed (a folder only when it is empty), `package.json` and a `transloco.config.ts` replaced with `--force` are put back as they were, and the error names the file that failed and says nothing was changed. If the undoing fails as well, the error lists the paths that were left behind.

### Running from another directory

`--cwd` (or `-C`) goes before the command and makes it run as if `transloco` was started in that directory:

```bash
transloco --cwd apps/shop extract
```
