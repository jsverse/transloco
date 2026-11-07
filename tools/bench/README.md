# Extraction benchmark

Two plain scripts for timing `extract` and `find` on a large project.

## Generate a project

```bash
node tools/bench/generate.mts                  # 3000 files, tmp/bench/project-3000
node tools/bench/generate.mts --files 10k
node tools/bench/generate.mts --files 30k --out tmp/bench/large
```

This writes the synthetic project described in [#1011](https://github.com/jsverse/transloco/issues/1011): components made of a `cN.component.ts` and a `cN.component.html`, two thirds of them using `TranslocoService`, `translate()`, `*transloco`, `| transloco` and `@if`/`@for` blocks, the rest plain Angular. Each Transloco component holds 9 keys, so 3000 files carry 9000 keys. A `transloco.config.js`, an `angular.json` and empty `en.json` / `es.json` files come with it.

The output depends on `--files` and `--seed` alone, two runs produce the same bytes. Both scripts take `--name value` as well as `--name=value`, and reject an argument they don't know, one given twice and an empty value. `generate.mts` only replaces an `--out` directory it generated itself, which it recognises by the `.transloco-bench-project` file it leaves there; any other directory that isn't empty is left alone and reported. The default location is under `tmp/`, which is git ignored.

## Run

```bash
nx build transloco-cli
node tools/bench/run.mts
node tools/bench/run.mts --project tmp/bench/project-10000 --runs 20 --warmup 3 --label after
```

It prints the median, min, max and standard deviation of the wall time and the peak resident memory per command, and writes the same numbers with the time and the memory of every single run to `tmp/bench/results/<label>-<project>.json`. The printed memory is the median over the runs of each run's peak, as a single run with an unlucky garbage collection can peak far above the others.

| Option              | Default                  | Meaning                                             |
| ------------------- | ------------------------ | --------------------------------------------------- |
| `--project <dir>`   | `tmp/bench/project-3000` | A project made by `generate.mts`.                   |
| `--runs <n>`        | `10`                     | Measured runs per command.                          |
| `--warmup <n>`      | `2`                      | Runs per command that are not measured.             |
| `--commands <list>` | `extract,find`           | The commands to measure.                            |
| `--label <name>`    | `transloco`              | Names the run in the results file.                  |
| `--out <file>`      | see above                | Where the JSON results go.                          |
| `--no-hyperfine`    |                          | Use the built-in loop even when hyperfine is there. |

The binary under test is chosen like in the golden suite: `TRANSLOCO_BIN` (default `dist/libs/transloco-cli/src/bin.js`), run with the current `node` when it is a `.js`, `.mjs` or `.cjs` file and executed directly otherwise, with `TRANSLOCO_BIN_ARGS` put in front of the command.

```bash
TRANSLOCO_BIN=/path/to/node_modules/@jsverse/transloco-keys-manager/src/index.js node tools/bench/run.mts --label legacy
```

[hyperfine](https://github.com/sharkdp/hyperfine) does the measuring when it is on the `PATH`. Otherwise a built-in loop does, taking the peak memory from `/usr/bin/time`.

## What is measured

- `extract` starts from empty translation files on every run, so each run extracts all the keys and writes them.
- `find` reads the translation files a full extraction produced, so it finds nothing missing and exits with 0.
- The output of the CLI is discarded.

## Comparing binaries

`extract` formats the files it writes with Prettier when Prettier resolves from where the binary is installed and a Prettier config applies to those files. A project generated under this repository picks up the workspace `.prettierrc`, and the built `dist` binary resolves the workspace's Prettier, so that run includes the formatting. A binary installed elsewhere may not. To compare two binaries, install them next to each other so both resolve the same packages, or generate the project outside of any Prettier config with `--out`.
