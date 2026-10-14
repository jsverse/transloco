# Golden suite

A black-box contract for the `transloco` binary. Every case runs the binary in a throwaway directory and compares what it did (the files it wrote, its exit code and, where it's part of the contract, its output) with what is committed here.

The runner (`golden.spec.ts`) imports nothing from Transloco. It only spawns a binary, so the same cases can hold another implementation of the CLI to the behaviour of this one: a different extraction engine behind a flag, or a native binary.

## Running

```bash
nx run transloco-cli:test-golden
```

The target builds the CLI first and then runs every spec under `libs/transloco-cli/tests`.

| Variable             | Purpose                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRANSLOCO_BIN`      | The binary under test, relative to the workspace root or absolute. Defaults to `dist/libs/transloco-cli/src/bin.js`. A `.js`, `.mjs` or `.cjs` file is run with the current `node`, anything else is executed directly. |
| `TRANSLOCO_BIN_ARGS` | Arguments put in front of each case's own, separated by whitespace. Meant for something like `--engine=...`.                                                                                                            |
| `GOLDEN_FILTER`      | A regular expression, only the cases whose id matches it run. The id is the path of the case under `cases/`, e.g. `^find/` or `pot$`.                                                                                   |
| `GOLDEN_UPDATE=1`    | Rewrites `expected/` and the stream snapshots of the cases that run from what the binary does. See [Updating](#updating).                                                                                               |
| `GOLDEN_KEEP=1`      | Keeps the working directory of each case and prints where it is.                                                                                                                                                        |

## A case

```
cases/<area>/<name>/
  case.json     what to run and what to expect of it
  input/        the working directory before the run (optional)
  expected/     every file the run creates or changes (optional)
  stdout.txt    the expected stdout, when it's snapshotted
  stderr.txt    the expected stderr, when it's snapshotted
```

`case.json`:

| Field                               | Meaning                                                                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                       | What the case pins down, in given/when/then form. It's the name of the test.                                                                                                                                                    |
| `args`                              | The arguments following the binary.                                                                                                                                                                                             |
| `exitCode`                          | The exact exit code.                                                                                                                                                                                                            |
| `env`                               | Extra environment variables for the run.                                                                                                                                                                                        |
| `fixtures`                          | Files copied into the working directory before the run: destination => path under `src/keys-manager/tests`.                                                                                                                     |
| `snapshot`                          | The streams (`stdout`, `stderr`) compared in full with `stdout.txt` / `stderr.txt`.                                                                                                                                             |
| `stdoutIncludes` / `stderrIncludes` | Texts the plain form of the stream has to contain.                                                                                                                                                                              |
| `stdoutMatches` / `stderrMatches`   | A regular expression the plain form of the stream has to match.                                                                                                                                                                 |
| `stdoutExcludes` / `stderrExcludes` | Texts the plain form of the stream must not contain.                                                                                                                                                                            |
| `stderrQuiet`                       | Whether stderr has to hold nothing but progress lines, see [Quiet stderr](#quiet-stderr). On unless the case pins stderr itself.                                                                                                |
| `allowStderr`                       | The reason a case may write more than progress to stderr. Turns `stderrQuiet` off.                                                                                                                                              |
| `sameStreamsAs`                     | The id of another case that has to print exactly the same normalized stdout and stderr. See [Same streams as another case](#same-streams-as-another-case).                                                                      |
| `requires`                          | Package => the lowest version of it the case can run against, e.g. `@boundary` blocks need `@angular/compiler` 22.2 and grouped `@case` labels need 21.1. The case is skipped when the JavaScript binary resolves an older one. |

A file whose name starts with `_dot_` stands for the same name starting with a dot, in `input/` as well as in `expected/`. A committed `.gitignore` would otherwise apply to the repository itself.

The `extract` cases derived from the in-process specs take their sources through `fixtures`, from the very directories those specs read (`src/keys-manager/tests/buildTranslationFiles/*`), instead of holding a copy. The two suites can't drift apart that way, and a fixture is shared by its `json` and `pot` cases. Their flags are the config the matching spec uses, see [Key order](#key-order) for the one addition.

## Comparison rules

- **Exit code**: exact.
- **Files**: every file that exists after the run and either didn't exist before it or has different content, compared byte for byte with `expected/`. A file missing from `expected/`, an extra one in it or an input file the run deleted all fail the case. A case without `expected/` asserts that nothing was written.
- **Streams**: compared only where the text is a contract: the help, the errors of the argument parser, the messages of `validate` and `optimize`, the summary of `find`. Before any comparison a stream is normalized: ANSI escape sequences are removed, the working directory becomes `<cwd>`, line endings become `\n` and trailing whitespace is dropped from every line.
  - A snapshot is the normalized stream, exactly.
  - `*Includes` and `*Matches` are checked against its _plain form_: box drawing characters removed, runs of whitespace collapsed to one space and empty lines dropped. That makes the content of the `find` summary table part of the contract and leaves its layout out of it.
- Progress output is never compared: spinners, emoji decorated status lines and the list of created files. Neither is the text of a JSON syntax error, which belongs to the JSON parser of the implementation. Such cases assert the shape of the line instead.

### Quiet stderr

A successful `extract` or `find` writes its progress to stderr and nothing else: without a terminal the spinner prints a line starting with `- ` for every step it begins and one starting with `✔ ` for every step it completes. Anything else on stderr is a warning or an error.

So unless a case pins stderr down itself, with a snapshot or `stderrMatches`, the runner requires stderr to be _quiet_: once those progress lines are dropped, nothing may be left. It applies to every case, whatever its exit code, and it's what catches a binary that starts warning about something, for instance about an option in the config file that the invoked command doesn't read. A case that legitimately writes more states why in `allowStderr`. None does today.

Stdout has no such rule, since most of it is decoration that isn't compared. Where the absence of a message on stdout matters, the case lists the texts in `stdoutExcludes`. The two `provenance` cases do: they share one config file holding every option of both `extract` and `find`, and assert that neither command says a word about the options it doesn't read. Beyond the usual wording of a warning, each of them excludes the names of the options only the other command reads, camelCase and kebab-case, from stdout and from stderr, so a friendly note about such an option fails as well, even one dressed up as a progress line. `output`, `replace` and `langs` are excluded as bare words for `find`: none of them occurs in what the command normally prints.

### Same streams as another case

A list of words only catches the remarks someone thought of. `sameStreamsAs` names another case, and the runner then runs that one as well and requires both to print exactly the same normalized stdout and stderr. Nothing has to be known about the wording: the binary only has to be consistent with itself. The two cases have to run the same arguments, and a case can't name itself; the runner fails either.

The `provenance/shared-config-*` cases use it. Each is compared with its `provenance/own-config-*` twin, the same project and the same command with a config that holds the options of that command alone. A binary that says anything at all about the options of the other command, on either stream and in whatever words, prints something the twin doesn't, and fails.

The binary runs with `NO_COLOR=1` and `NODE_NO_WARNINGS=1`, without a TTY, and with `FORCE_COLOR`, `DEBUG`, `PRODUCTION` and `NODE_OPTIONS` removed from the environment.

## Key order

Without `--sort` the keys of a translation file come out in the order they were extracted in, and for keys spread over several source files that follows the order the file system lists those files in. That order differs between platforms, so it can't be pinned byte for byte.

Every `extract` case whose fixture holds more than one template or more than one TypeScript file therefore passes `--sort` on top of the flags of its spec. The cases with a single file of each kind don't, and pin the unsorted order: templates before TypeScript, and within a file the order of the extractors.

## Updating

```bash
GOLDEN_UPDATE=1 GOLDEN_FILTER='^find/' nx run transloco-cli:test-golden
```

This records what the binary does now, which is not the same as what it should do. Review the diff of `expected/`, `stdout.txt` and `stderr.txt` like any other change before committing it, and check a new `extract` case against the assertions of the spec its fixture belongs to.

`exitCode`, `*Includes` and `*Matches` are written by hand and never regenerated. A wrong exit code fails the case in update mode as well.

A case with `requires` is skipped, and so not regenerated, unless the binary resolves a recent enough package. To update the `boundary` cases point `TRANSLOCO_BIN` at a CLI installed next to `@angular/compiler` 22.2 or later.

## Stricter than the legacy bins

A legacy bin prints a deprecation notice on stderr, which the quiet stderr cases reject, so it has to run with `process.noDeprecation` set, which is what Node's `--no-deprecation` flag does: set `TRANSLOCO_BIN` to the absolute path of `node` and start `TRANSLOCO_BIN_ARGS` with `--no-deprecation` followed by the bin's path, as the runner removes `NODE_OPTIONS` from the environment. A bare `node` does not work, because the runner resolves `TRANSLOCO_BIN` as a path.

The `strictness` cases pin down what this binary rejects, with exit code 1 and before anything is written. The legacy bins (`transloco-keys-manager`, `transloco-optimize`, `transloco-scoped-libs`) accept most of it, which is why those cases aren't part of a comparison with them:

- an option the command doesn't read, an unknown option or command, a missing or an extra argument;
- an option taking a single value given more than once;
- an empty or blank value, and an empty path inside `--input`. `--default-value` may be empty;
- an option that needs a value directly followed by another option or by `--`. A value starting with a dash is written `--option=value`;
- several letters behind one dash that aren't all flags (`-su` is fine): a value glued to its option (`-cpath`, `-c=path`), an option taking a value inside a cluster (`-sc path`), a long option written with one dash in any spelling (`-output`, `-out=i18n`, `-defaultValue=TODO`). A value always goes in the next argument or after `--option=`;
- a `--config` path that doesn't exist, for `extract`, `find` and `scoped-libs` alike. A directory is searched for a config.

A request for the help gets past every one of them, and past the version: `--help`, `-h` or the letter among flags behind one dash, anywhere before `--`, prints the help of the command it follows and exits with 0 before anything else is looked at. The `help` cases pin that down next to the usage texts, along with what isn't a request, such as the value in `--default-value=-h`.

## Known issues not covered

These are defects of the current implementation. They are left out on purpose, so that the suite doesn't turn them into expected behaviour:

- `find --file-format pot` fails while parsing the `.pot` files as JSON.
- A `transloco.config.ts` using `export default` fails to load in a project whose `package.json` sets `"type": "commonjs"` explicitly. Without a `type`, or with `"type": "module"`, it loads: the `config-file/typescript-*` cases cover the file `ng add` generates.
- A `transloco.config.mjs` doesn't load.
- A config at the workspace root isn't found without `--config` when the source root is a sub directory, which it usually is. The cases that need a config pass `--config`.
- `extract --remove-extra-keys` on a nested translation file without `--unflat` leaves the file half flat and half nested (`libs/transloco-keys-manager/v9.md`, item 1). The in-process spec for it asserts a subset of the file for the same reason.
- `extract --remove-extra-keys` deletes `*.comment` keys although `find` doesn't count them as extra (`v9.md`, item 2). The `find` side is covered.
- `extract` formats the JSON files it writes with Prettier when both Prettier and a Prettier config for those files resolve. That depends on what is installed next to the binary, so no case has a Prettier config.
- `scoped-libs --watch` never exits.

## The other spec in this target

`tests/built-bin/lazy-loading.spec.ts` rides along because it needs the build too, but it isn't part of the contract: it checks how the JavaScript build is put together and is skipped when `TRANSLOCO_BIN` is set. It runs the built bin with a module hook that records everything the process loads and holds the light commands to an allowlist: `--help`, `--version` and a rejected command line may load the program, its error and package helpers, `commander` and `@commander-js/extra-typings`; `validate` and `optimize` add their own runner, implementation and packages. Anything else, such as the keys manager, `typescript` or a spinner, fails the spec until the allowlist is extended on purpose.
