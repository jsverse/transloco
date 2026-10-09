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

| Command                         | What it does                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `transloco extract`             | Extracts the translation keys of the sources into the translation files.             |
| `transloco find`                | Reports the keys missing from the translation files and the extra ones in them.      |
| `transloco validate <files...>` | Verifies the translation files are valid JSON without duplicate keys.                |
| `transloco optimize [dist]`     | Flattens and minifies the built translation files, dropping the translator comments. |
| `transloco scoped-libs`         | Copies the translation files of scoped libraries into the application.               |

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

### Running from another directory

`--cwd` (or `-C`) goes before the command and makes it run as if `transloco` was started in that directory:

```bash
transloco --cwd apps/shop extract
```
