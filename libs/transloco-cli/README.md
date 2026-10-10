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

Asking for the help is the one thing that comes before all of it. A help request anywhere before `--` prints the help and exits with code 0, ahead of the version and of any other argument error, and nothing runs: `transloco extract --frobnicate -h` and `transloco -V -h` both print the help. A request is `--help`, `-h`, or the letter among flags behind one dash (`-sh`), and it gets the help of the command it follows. That is the program when it stands before the command, or when what precedes it doesn't name one (`transloco translate -h`, `transloco --frobnicate extract -h`). What only looks like one stays what it is: the value in `--default-value=-h`, whatever comes after `--`, and the letter next to anything but flags (`-hc`, `-h=1`).

| Command                         | What it does                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `transloco extract`             | Extracts the translation keys of the sources into the translation files.             |
| `transloco find`                | Reports the keys missing from the translation files and the extra ones in them.      |
| `transloco validate <files...>` | Verifies the translation files are valid JSON without duplicate keys.                |
| `transloco optimize [dist]`     | Flattens and minifies the built translation files, dropping the translator comments. |
| `transloco scoped-libs`         | Copies the translation files of scoped libraries into the application.               |
| `transloco join`                | Joins the translation files of all scopes into one file per language.                |
| `transloco split`               | Splits joined translation files back into the scope folders.                         |

### extract

```bash
transloco extract --input src/app --output src/assets/i18n --langs en es
```

`extract` and `find` need `@angular/compiler` and `typescript`, which every Angular project has. The other commands run without them.

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

Merges the translation files of every scope into the root file of the same language and writes one file per language to the out folder, `dist-i18n` unless `--out-dir` says otherwise. A scope is a folder of the translations root, or a folder of the `scopePathMap` of the config. A scope folder nested in another one is stored under a dotted key beside its parent, such as `admin.users` for `admin/users`, and `split` restores it. The default language is left out unless `--include-default-lang` is set, and the command stops with `1` when that leaves nothing to join, which is when only the default language is found.

The root is `--translations-path`, then `rootTranslationsPath` of the config, and the default language is `--default-lang`, then `defaultLang` of the config. The out folder is emptied first, so it has to be a real folder inside the working directory that does not overlap the translations: the command refuses to run when it is the working directory or a folder above it, a folder outside of it, a symbolic link or a folder reached through one that leads out, a file, or the translations root or a scope folder, or a folder above or below one. Links are followed before any of this is judged, and nothing is changed when the folder is refused. Only `.json` files count as translations. Exits with `1` when the root doesn't exist or holds no translation file, when two files define the same key or a file is not valid JSON, and nothing is written.

### split

```bash
transloco split --translations-path src/assets/i18n --source dist-i18n
```

Hands the translations of every scope in the joined files, `dist-i18n` unless `--source` says otherwise, back to the files of its folder, and what is left to the root file of the language. Only the files that exist are written, none is created. The root comes from `--translations-path` or `rootTranslationsPath` of the config, and the scopes are found the way `join` finds them. A scope folder nested in another one, at any depth, gets back the dotted key `join` stored it under, such as `admin.users`, so that `join` followed by `split` leaves every file as it was. Exits with `1` when the root or the source doesn't exist or holds no translation file, or a joined file is not valid JSON, and nothing is written.

### Running from another directory

`--cwd` (or `-C`) goes before the command and makes it run as if `transloco` was started in that directory:

```bash
transloco --cwd apps/shop extract
```
