/**
 * Times `extract` and `find` of a transloco binary against a project made by
 * generate.mts, and reports the median/min/max/stddev wall time and the peak
 * resident memory of each.
 *
 * The binary under test is picked the same way the golden suite picks it:
 * `TRANSLOCO_BIN` (default: the built `dist/libs/transloco-cli/src/bin.js`),
 * run with the current `node` when it's a `.js`/`.mjs`/`.cjs` file and executed
 * directly otherwise, with `TRANSLOCO_BIN_ARGS` put in front of the command.
 *
 * Measured with hyperfine when it's on the PATH, and with a built-in loop
 * otherwise, which gets the peak memory from `/usr/bin/time`.
 *
 *   node tools/bench/generate.mts
 *   nx build transloco-cli
 *   node tools/bench/run.mts
 *   node tools/bench/run.mts --project tmp/bench/project-10000 --runs 20 --label after
 *   TRANSLOCO_BIN=path/to/transloco-keys-manager/src/index.js node tools/bench/run.mts --label legacy
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { cpus, platform, release, totalmem } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { assertUsableOptions } from './args.mts';

type Command = 'extract' | 'find';

interface Measurement {
  command: Command;
  runs: number;
  /** Seconds. */
  median: number;
  mean: number;
  min: number;
  max: number;
  stddev: number;
  times: number[];
  /**
   * Bytes: the median over the runs of the peak resident memory of each, which
   * a single run with an unlucky garbage collection doesn't move. `null` when
   * it couldn't be measured.
   */
  peakRss: number | null;
  peakRssMax: number | null;
  peakRssPerRun: number[];
}

const usage =
  'Usage: run.mts [--project <dir>] [--runs <n>] [--warmup <n>] [--commands extract,find] [--label <name>] [--out <file.json>] [--no-hyperfine]';

/** Strict, so a misspelled or misplaced argument fails instead of silently falling back to a default. */
function parseArguments() {
  try {
    const { values, tokens } = parseArgs({
      options: {
        project: {
          type: 'string',
          default: join('tmp', 'bench', 'project-3000'),
        },
        runs: { type: 'string', default: '10' },
        warmup: { type: 'string', default: '2' },
        commands: { type: 'string', default: 'extract,find' },
        label: { type: 'string', default: 'transloco' },
        out: { type: 'string' },
        'no-hyperfine': { type: 'boolean', default: false },
        // Internal: what hyperfine runs between two measurements.
        'reset-project': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
      strict: true,
      allowPositionals: false,
      tokens: true,
    });

    assertUsableOptions(tokens);

    return values;
  } catch (error) {
    return fail((error as Error).message);
  }
}

function fail(message: string): never {
  console.error(`${message}\n${usage}`);
  process.exit(1);
}

function parseCount(name: string, value: string, minimum: number) {
  const count = Number(value);

  return Number.isInteger(count) && count >= minimum
    ? count
    : fail(
        `--${name} takes a whole number of at least ${minimum}. Got "${value}".`,
      );
}

const args = parseArguments();

if (args.help) {
  console.log(usage);
  process.exit(0);
}

const projectDir = resolve(args.project);
const runs = parseCount('runs', args.runs, 1);
const warmup = parseCount('warmup', args.warmup, 0);
const commands = args.commands.split(',').map((command): Command => {
  return command === 'extract' || command === 'find'
    ? command
    : fail(`--commands takes extract, find or both. Got "${command}".`);
});
const label = args.label;
const outFile = resolve(
  args.out ||
    join('tmp', 'bench', 'results', `${label}-${basename(projectDir)}.json`),
);

const bin = resolve(
  process.env['TRANSLOCO_BIN'] ||
    join('dist', 'libs', 'transloco-cli', 'src', 'bin.js'),
);
const binArgs = (process.env['TRANSLOCO_BIN_ARGS'] ?? '')
  .split(/\s+/)
  .filter(Boolean);
const binCommand = /\.[cm]?js$/.test(bin)
  ? [process.execPath, bin, ...binArgs]
  : [bin, ...binArgs];

if (!existsSync(bin)) {
  console.error(
    `The binary under test does not exist: ${bin}\nBuild it first (nx build transloco-cli) or point TRANSLOCO_BIN at one.`,
  );
  process.exit(1);
}

const configFile = join(projectDir, 'transloco.config.js');
if (!existsSync(configFile)) {
  console.error(
    `${projectDir} is not a generated project. Create one with: node tools/bench/generate.mts`,
  );
  process.exit(1);
}

const i18nDir = join(projectDir, 'src', 'assets', 'i18n');
const translationFiles = readdirSync(i18nDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => join(i18nDir, file));
// The config sits at the workspace root, where the keys manager only looks when told to.
const commandArgs: Record<Command, string[]> = {
  extract: ['extract', '--config', 'transloco.config.js'],
  find: ['find', '--config', 'transloco.config.js'],
};

/** Puts the translation files back to how generate.mts left them. */
function emptyTranslationFiles() {
  for (const file of translationFiles) {
    writeFileSync(file, '{}\n');
  }
}

function run(command: string[], options: { collectStderr?: boolean } = {}) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: projectDir,
    encoding: 'utf-8',
    // The CLI's own output would only add the terminal's speed to the numbers.
    stdio: ['ignore', 'ignore', options.collectStderr ? 'pipe' : 'ignore'],
    env: { ...process.env, NO_COLOR: '1' },
    maxBuffer: 256 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function assertSucceeded(status: number | null, command: string[]) {
  if (status !== 0) {
    console.error(`"${command.join(' ')}" exited with ${status}.`);
    process.exit(1);
  }
}

/**
 * `extract` is always measured writing into empty translation files and `find`
 * always reads the ones a full extraction produced, so every run of a command
 * does the same work.
 */
function prepare(command: Command) {
  emptyTranslationFiles();

  if (command === 'find') {
    const extract = [...binCommand, ...commandArgs.extract];

    assertSucceeded(run(extract).status, extract);
  }
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(
  command: Command,
  times: number[],
  peakRssPerRun: number[],
): Measurement {
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  const variance =
    times.length > 1
      ? times.reduce((sum, time) => sum + (time - mean) ** 2, 0) /
        (times.length - 1)
      : 0;

  return {
    command,
    runs: times.length,
    median: median(times),
    mean,
    min: Math.min(...times),
    max: Math.max(...times),
    stddev: Math.sqrt(variance),
    times,
    peakRss: peakRssPerRun.length ? median(peakRssPerRun) : null,
    peakRssMax: peakRssPerRun.length ? Math.max(...peakRssPerRun) : null,
    peakRssPerRun,
  };
}

/** `/usr/bin/time` reports the peak resident set size, in a format of its own per platform. */
const timeCommand = existsSync('/usr/bin/time')
  ? ['/usr/bin/time', platform() === 'darwin' ? '-l' : '-v']
  : null;

function parsePeakRss(timeOutput: string): number | null {
  // macOS: "  123456789  maximum resident set size", in bytes
  const bsd = /(\d+)\s+maximum resident set size/.exec(timeOutput);
  if (bsd) return Number(bsd[1]);

  // GNU: "Maximum resident set size (kbytes): 123456"
  const gnu = /Maximum resident set size \(kbytes\): (\d+)/.exec(timeOutput);
  if (gnu) return Number(gnu[1]) * 1024;

  return null;
}

function measureWithNode(command: Command): Measurement {
  const cliCommand = [...binCommand, ...commandArgs[command]];
  const timed = timeCommand ? [...timeCommand, ...cliCommand] : cliCommand;
  const times: number[] = [];
  const peakRssPerRun: number[] = [];

  for (let i = 0; i < warmup + runs; i++) {
    if (command === 'extract' || i === 0) {
      prepare(command);
    }

    const start = process.hrtime.bigint();
    const { status, stderr } = run(timed, { collectStderr: true });
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;

    assertSucceeded(status, cliCommand);

    if (i >= warmup) {
      const rss = parsePeakRss(stderr ?? '');

      times.push(seconds);
      if (rss !== null) {
        peakRssPerRun.push(rss);
      }
    }
  }

  return summarize(command, times, peakRssPerRun);
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function measureWithHyperfine(command: Command): Measurement {
  const cliCommand = [...binCommand, ...commandArgs[command]];
  const exportFile = join(
    dirname(outFile),
    `hyperfine-${label}-${command}.json`,
  );
  const reset = [
    process.execPath,
    import.meta.filename,
    '--reset-project',
    `--project=${projectDir}`,
  ];

  prepare(command);

  const hyperfine = [
    'hyperfine',
    '--warmup',
    String(warmup),
    '--runs',
    String(runs),
    // `find` keeps reading the files the preparation above extracted.
    ...(command === 'extract'
      ? ['--prepare', reset.map(shellQuote).join(' ')]
      : []),
    '--export-json',
    exportFile,
    cliCommand.map(shellQuote).join(' '),
  ];
  const { status } = spawnSync(hyperfine[0], hyperfine.slice(1), {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, NO_COLOR: '1' },
  });

  assertSucceeded(status, hyperfine);

  const [result] = JSON.parse(readFileSync(exportFile, 'utf-8')).results;
  const memory: number[] | undefined = result.memory_usage_byte;

  return summarize(command, result.times, memory ?? []);
}

// Used as hyperfine's `--prepare` step.
if (args['reset-project']) {
  emptyTranslationFiles();
  process.exit(0);
}

const hasHyperfine =
  !args['no-hyperfine'] &&
  spawnSync('hyperfine', ['--version'], { stdio: 'ignore' }).status === 0;
const measure = hasHyperfine ? measureWithHyperfine : measureWithNode;

mkdirSync(dirname(outFile), { recursive: true });

console.log(`Binary:  ${binCommand.join(' ')}`);
console.log(`Project: ${projectDir}`);
console.log(
  `Tool:    ${hasHyperfine ? 'hyperfine' : 'built-in loop'}, ${warmup} warmup + ${runs} measured runs per command\n`,
);

const measurements = commands.map((command) => measure(command));
// Leave the project the way generate.mts made it.
emptyTranslationFiles();

const seconds = (value: number) => `${value.toFixed(3)} s`;
const megabytes = (value: number | null) =>
  value === null ? 'n/a' : `${(value / 1024 / 1024).toFixed(0)} MB`;

const rows = [
  ['command', 'median', 'min', 'max', 'stddev', 'peak RSS'],
  ...measurements.map((measurement) => [
    measurement.command,
    seconds(measurement.median),
    seconds(measurement.min),
    seconds(measurement.max),
    seconds(measurement.stddev),
    megabytes(measurement.peakRss),
  ]),
];
const widths = rows[0].map((_, column) =>
  Math.max(...rows.map((row) => row[column].length)),
);
for (const row of rows) {
  console.log(
    row
      .map((cell, column) => cell.padEnd(widths[column]))
      .join('  ')
      .trimEnd(),
  );
}

writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      label,
      bin,
      binArgs,
      project: projectDir,
      tool: hasHyperfine ? 'hyperfine' : 'node',
      warmup,
      runs,
      node: process.version,
      platform: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model,
      cores: cpus().length,
      memory: totalmem(),
      date: new Date().toISOString(),
      results: measurements,
    },
    null,
    2,
  )}\n`,
);
console.log(`\nResults written to ${outFile}`);
