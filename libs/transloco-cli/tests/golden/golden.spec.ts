/**
 * The black-box contract of the `transloco` binary, see the README next to this file.
 *
 * Nothing of Transloco is imported here on purpose: the binary under test is
 * whatever `TRANSLOCO_BIN` points at, which may not even be JavaScript.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

type Stream = 'stdout' | 'stderr';

interface GoldenCase {
  /** What the case pins down, shown as the test's name. */
  description: string;
  /** The arguments following the binary. */
  args: string[];
  /** Hand written and never regenerated, see the README. */
  exitCode: number;
  env?: Record<string, string>;
  /** Destination in the working directory => path under `FIXTURES_ROOT`. */
  fixtures?: Record<string, string>;
  /** The streams compared in full against `stdout.txt` / `stderr.txt`. */
  snapshot?: Stream[];
  /** Texts the plain form of the stream has to contain. */
  stdoutIncludes?: string[];
  stderrIncludes?: string[];
  /** A regular expression the plain form of the stream has to match. */
  stdoutMatches?: string;
  stderrMatches?: string;
  /** Texts the plain form of the stream must not contain. */
  stdoutExcludes?: string[];
  stderrExcludes?: string[];
  /**
   * Whether stderr has to hold nothing but progress lines, so that a warning
   * never goes unnoticed. On by default, unless the case pins stderr down
   * itself with a snapshot or `stderrMatches`.
   */
  stderrQuiet?: boolean;
  /** Why the case may write more than progress to stderr. Turns `stderrQuiet` off. */
  allowStderr?: string;
  /**
   * The id of another case this one has to print exactly the same normalized
   * stdout and stderr as. The other case is run for the comparison, and has to
   * run the same arguments.
   */
  sameStreamsAs?: string;
  /** Package => the lowest version of it the case can run against. */
  requires?: Record<string, string>;
}

interface RunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

type Tree = Map<string, Buffer>;

const CASES_ROOT = path.join(__dirname, 'cases');
/** The sources of the in-process specs, shared so both suites read the same input. */
const FIXTURES_ROOT = path.resolve(__dirname, '../../src/keys-manager/tests');
const DEFAULT_BIN = path.resolve(
  __dirname,
  '../../../../dist/libs/transloco-cli/src/bin.js',
);

const bin = path.resolve(process.env['TRANSLOCO_BIN'] || DEFAULT_BIN);
const binArgs = (process.env['TRANSLOCO_BIN_ARGS'] ?? '')
  .split(/\s+/)
  .filter(Boolean);
const isNodeScript = /\.[cm]?js$/.test(bin);
const update = process.env['GOLDEN_UPDATE'] === '1';
const keepWorkdirs = process.env['GOLDEN_KEEP'] === '1';
const filter = process.env['GOLDEN_FILTER']
  ? new RegExp(process.env['GOLDEN_FILTER'])
  : null;

/** A committed `.gitignore` would apply to the repository, so dot files are stored escaped. */
const DOT_PREFIX = '_dot_';

function toStoredName(name: string) {
  return name.startsWith('.') ? `${DOT_PREFIX}${name.slice(1)}` : name;
}

function fromStoredName(name: string) {
  return name.startsWith(DOT_PREFIX)
    ? `.${name.slice(DOT_PREFIX.length)}`
    : name;
}

/** Reads every file below `root`, keyed by its `/` separated relative path. */
function readTree(root: string, rename = (name: string) => name): Tree {
  const tree: Tree = new Map();

  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relativePath = prefix + rename(entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, `${relativePath}/`);
      } else {
        tree.set(relativePath, fs.readFileSync(fullPath));
      }
    }
  };

  if (fs.existsSync(root)) {
    walk(root, '');
  }

  return tree;
}

function writeTree(root: string, tree: Tree, rename = (name: string) => name) {
  for (const [relativePath, content] of tree) {
    const filePath = path.join(root, ...relativePath.split('/').map(rename));

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

function sortedKeys(tree: Tree) {
  return [...tree.keys()].sort();
}

function findCases(dir: string, prefix = ''): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .flatMap((entry) => {
      const id = prefix + entry.name;
      const caseDir = path.join(dir, entry.name);

      return fs.existsSync(path.join(caseDir, 'case.json'))
        ? [id]
        : findCases(caseDir, `${id}/`);
    });
}

function runBinary(args: string[], cwd: string, env: Record<string, string>) {
  const [command, commandArgs] = isNodeScript
    ? [process.execPath, [bin, ...binArgs, ...args]]
    : [bin, [...binArgs, ...args]];

  const inherited = { ...process.env };
  // Whatever would make the output depend on the machine running the suite
  for (const name of ['FORCE_COLOR', 'DEBUG', 'PRODUCTION', 'NODE_OPTIONS']) {
    delete inherited[name];
  }

  return new Promise<RunResult>((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env: { ...inherited, NO_COLOR: '1', NODE_NO_WARNINGS: '1', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (exitCode) =>
      resolve({
        exitCode,
        stdout: Buffer.concat(stdout).toString('utf-8'),
        stderr: Buffer.concat(stderr).toString('utf-8'),
      }),
    );
  });
}

/** What a snapshot holds: the stream without colors, with the working directory made portable. */
function normalize(text: string, workdir: string) {
  return (
    text
      // eslint-disable-next-line no-control-regex -- ANSI escape sequences are control characters
      .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
      .replace(/\r\n/g, '\n')
      .split(workdir)
      .join('<cwd>')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
  );
}

/**
 * What `*Includes` and `*Matches` are checked against: the normalized stream
 * without box drawing characters and with whitespace collapsed, so the layout
 * of a table isn't part of the contract while its content is.
 */
function toPlainText(normalized: string) {
  return normalized
    .replace(/[─-╿]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * What a spinner writes without a terminal: a line per step it starts ("- ")
 * and one per step it completes ("✔ "). It's the only output a successful run
 * may send to stderr.
 */
const PROGRESS_LINE = /^(- |✔ )/;

/** The lines of a plain stream that are anything but progress. */
function withoutProgress(plain: string) {
  return plain.split('\n').filter((line) => line && !PROGRESS_LINE.test(line));
}

function compareVersions(a: string, b: string) {
  const [partsA, partsB] = [a, b].map((version) =>
    version.split('.').map((part) => parseInt(part, 10) || 0),
  );

  for (let i = 0; i < 3; i++) {
    const difference = (partsA[i] ?? 0) - (partsB[i] ?? 0);

    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Why the case can't run against the binary, if so. Only a JavaScript binary
 * has peers to look at, anything else is expected to support every case.
 */
function unmetRequirement({ requires = {} }: GoldenCase) {
  if (!isNodeScript) return null;

  for (const [name, minimum] of Object.entries(requires)) {
    let installed: string;

    try {
      installed = JSON.parse(
        fs.readFileSync(
          createRequire(bin).resolve(`${name}/package.json`),
          'utf-8',
        ),
      ).version;
    } catch {
      // Not resolvable from the binary: let the case run and say so itself.
      continue;
    }

    if (compareVersions(installed, minimum) < 0) {
      return `needs ${name} >= ${minimum}, found ${installed}`;
    }
  }

  return null;
}

function caseDirOf(id: string) {
  return path.join(CASES_ROOT, ...id.split('/'));
}

function readCase(id: string): GoldenCase {
  return JSON.parse(
    fs.readFileSync(path.join(caseDirOf(id), 'case.json'), 'utf-8'),
  );
}

/** A fresh directory holding the input of the case and its fixtures. */
function createWorkdir(caseDir: string, golden: GoldenCase) {
  const workdir = fs.mkdtempSync(
    // The real path, as that's what the binary sees as its working directory.
    path.join(fs.realpathSync(os.tmpdir()), 'transloco-golden-'),
  );

  writeTree(workdir, readTree(path.join(caseDir, 'input'), fromStoredName));
  for (const [destination, fixture] of Object.entries(golden.fixtures ?? {})) {
    fs.cpSync(
      path.join(FIXTURES_ROOT, fixture),
      path.join(workdir, destination),
      { recursive: true },
    );
  }

  return workdir;
}

/** Runs another case for its streams alone: what that case expects is its own business. */
async function streamsOf(id: string) {
  const golden = readCase(id);
  const workdir = createWorkdir(caseDirOf(id), golden);

  try {
    const result = await runBinary(golden.args, workdir, golden.env ?? {});

    return {
      stdout: normalize(result.stdout, workdir),
      stderr: normalize(result.stderr, workdir),
    };
  } finally {
    fs.rmSync(workdir, { recursive: true, force: true });
  }
}

describe.concurrent('transloco golden suite', () => {
  beforeAll(() => {
    if (!fs.existsSync(bin)) {
      throw new Error(
        `The binary under test does not exist: ${bin}\nBuild it first (nx build transloco-cli) or point TRANSLOCO_BIN at one.`,
      );
    }
  });

  const ids = findCases(CASES_ROOT).filter((id) => !filter || filter.test(id));

  it(`GIVEN the cases directory
      WHEN it is searched for case descriptors
      THEN at least one case is found, so an empty run never passes for a green suite`, () => {
    expect(ids.length).toBeGreaterThan(0);
  });

  for (const id of ids) {
    const caseDir = caseDirOf(id);
    const golden = readCase(id);
    const skipReason = unmetRequirement(golden);

    it.skipIf(skipReason !== null)(
      `${id}: ${golden.description}${skipReason ? ` [skipped: ${skipReason}]` : ''}`,
      async () => {
        const workdir = createWorkdir(caseDir, golden);

        try {
          const before = readTree(workdir);
          const result = await runBinary(
            golden.args,
            workdir,
            golden.env ?? {},
          );
          const after = readTree(workdir);

          const streams = {
            stdout: normalize(result.stdout, workdir),
            stderr: normalize(result.stderr, workdir),
          };
          const output = `\n--- stdout ---\n${streams.stdout}\n--- stderr ---\n${streams.stderr}`;

          expect(result.exitCode, `exit code${output}`).toBe(golden.exitCode);

          // Every file the run created or changed, nothing more and nothing less
          const written: Tree = new Map(
            [...after].filter(
              ([file, content]) => !before.get(file)?.equals(content),
            ),
          );
          const deleted = sortedKeys(before).filter((file) => !after.has(file));
          const expectedDir = path.join(caseDir, 'expected');

          if (update) {
            fs.rmSync(expectedDir, { recursive: true, force: true });
            writeTree(expectedDir, written, toStoredName);
          }

          const expected = readTree(expectedDir, fromStoredName);

          expect(deleted, `deleted files${output}`).toEqual([]);
          expect(sortedKeys(written), `written files${output}`).toEqual(
            sortedKeys(expected),
          );
          for (const [file, content] of expected) {
            const actual = written.get(file) as Buffer;

            // As text first for a readable diff, then the bytes themselves
            expect(actual.toString('utf-8'), file).toBe(
              content.toString('utf-8'),
            );
            expect(actual.equals(content), `bytes of ${file}`).toBe(true);
          }

          if (golden.sameStreamsAs) {
            // Compared with itself, or with a different command line, a case
            // would prove nothing.
            expect(
              golden.sameStreamsAs,
              'sameStreamsAs names the case itself',
            ).not.toBe(id);
            expect(
              readCase(golden.sameStreamsAs).args,
              `sameStreamsAs: ${golden.sameStreamsAs} runs other arguments`,
            ).toEqual(golden.args);

            const reference = await streamsOf(golden.sameStreamsAs);

            for (const stream of ['stdout', 'stderr'] as const) {
              expect(
                streams[stream],
                `${stream} differs from the one of ${golden.sameStreamsAs}`,
              ).toBe(reference[stream]);
            }
          }

          const pinsStderr =
            golden.snapshot?.includes('stderr') || golden.stderrMatches;
          const stderrQuiet =
            !golden.allowStderr && (golden.stderrQuiet ?? !pinsStderr);

          if (stderrQuiet) {
            expect(
              withoutProgress(toPlainText(streams.stderr)),
              'stderr holds more than progress lines',
            ).toEqual([]);
          }

          for (const stream of ['stdout', 'stderr'] as const) {
            const snapshotFile = path.join(caseDir, `${stream}.txt`);
            const plain = toPlainText(streams[stream]);

            if (golden.snapshot?.includes(stream)) {
              if (update) {
                fs.writeFileSync(snapshotFile, streams[stream]);
              }

              expect(streams[stream], stream).toBe(
                fs.readFileSync(snapshotFile, 'utf-8'),
              );
            }

            for (const text of golden[`${stream}Includes`] ?? []) {
              expect(plain, stream).toContain(text);
            }

            const pattern = golden[`${stream}Matches`];
            if (pattern) {
              expect(plain, stream).toMatch(new RegExp(pattern));
            }

            for (const text of golden[`${stream}Excludes`] ?? []) {
              expect(plain, stream).not.toContain(text);
            }
          }
        } finally {
          if (keepWorkdirs) {
            console.log(`${id}: kept ${workdir}`);
          } else {
            fs.rmSync(workdir, { recursive: true, force: true });
          }
        }
      },
      60_000,
    );
  }
});
