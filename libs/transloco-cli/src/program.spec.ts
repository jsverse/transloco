import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from './errors';
import { createProgram } from './program';
import { collectOutput, everyCommand } from './tests/program-harness';

const runners = vi.hoisted(() => ({
  runExtract: vi.fn(),
  runFind: vi.fn(),
  runValidate: vi.fn(),
  runOptimize: vi.fn(),
  runScopedLibs: vi.fn(),
}));

vi.mock('./commands/extract.js', () => ({ runExtract: runners.runExtract }));
vi.mock('./commands/find.js', () => ({ runFind: runners.runFind }));
vi.mock('./commands/validate.js', () => ({
  runValidate: runners.runValidate,
}));
vi.mock('./commands/optimize.js', () => ({
  runOptimize: runners.runOptimize,
}));
vi.mock('./commands/scoped-libs.js', () => ({
  runScopedLibs: runners.runScopedLibs,
}));

const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
);

/**
 * Runs the program the way the bin does, except that commander throws instead
 * of exiting the process and its output is collected.
 */
function setup() {
  const program = createProgram();
  const output = collectOutput(program);

  return {
    output,
    run: (...args: string[]) => program.parseAsync(args, { from: 'user' }),
  };
}

/** The help is wrapped to the terminal width, which may split what a test looks for. */
function unwrap(text: string) {
  return text.replace(/\s+/g, ' ');
}

function expectNoRunnerCalled() {
  for (const runner of Object.values(runners)) {
    expect(runner).not.toHaveBeenCalled();
  }
}

describe('createProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extract', () => {
    it(`GIVEN every option of the command by its long name
        WHEN the program runs
        THEN the runner gets them as the keys manager inline config`, async () => {
      await setup().run(
        'extract',
        '--project',
        'admin',
        '--config',
        'configs/transloco.config.js',
        '--input',
        'src,projects/lib',
        '--output',
        'i18n',
        '--langs',
        'en',
        'es',
        '--file-format',
        'pot',
        '--marker',
        '_',
        '--replace',
        '--remove-extra-keys',
        '--sort',
        '--unflat',
        '--default-value',
        '{{key}}',
      );

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
        project: 'admin',
        config: 'configs/transloco.config.js',
        input: ['src', 'projects/lib'],
        output: 'i18n',
        langs: ['en', 'es'],
        fileFormat: 'pot',
        marker: '_',
        replace: true,
        removeExtraKeys: true,
        sort: true,
        unflat: true,
        defaultValue: '{{key}}',
      });
      expect(runners.runFind).not.toHaveBeenCalled();
    });

    it(`GIVEN every option of the command by its alias
        WHEN the program runs
        THEN the runner gets the same config as with the long names`, async () => {
      await setup().run(
        'extract',
        '-c',
        'transloco.config.js',
        '-i',
        'src',
        '-o',
        'i18n',
        '-l',
        'en',
        '-f',
        'json',
        '-m',
        '_',
        '-r',
        '-R',
        '-s',
        '-u',
        '-d',
        'missing',
      );

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
        config: 'transloco.config.js',
        input: ['src'],
        output: 'i18n',
        langs: ['en'],
        fileFormat: 'json',
        marker: '_',
        replace: true,
        removeExtraKeys: true,
        sort: true,
        unflat: true,
        defaultValue: 'missing',
      });
    });

    it(`GIVEN no options
        WHEN the program runs
        THEN the config holds the command alone, leaving the rest to the config file`, async () => {
      await setup().run('extract');

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
      });
    });

    it(`GIVEN the langs option repeated
        WHEN the program runs
        THEN the languages are collected just as when listed after a single flag`, async () => {
      await setup().run('extract', '--langs', 'en', '--langs', 'es', 'it');

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
        langs: ['en', 'es', 'it'],
      });
    });
  });

  describe('find', () => {
    it(`GIVEN every option of the command by its long name
        WHEN the program runs
        THEN the runner gets them as the keys manager inline config`, async () => {
      await setup().run(
        'find',
        '--project',
        'admin',
        '--config',
        'transloco.config.js',
        '--input',
        'src,projects/lib',
        '--file-format',
        'json',
        '--marker',
        '_',
        '--sort',
        '--unflat',
        '--default-value',
        'missing',
        '--translations-path',
        'i18n',
        '--add-missing-keys',
        '--emit-error-on-extra-keys',
      );

      expect(runners.runFind).toHaveBeenCalledExactlyOnceWith({
        command: 'find',
        project: 'admin',
        config: 'transloco.config.js',
        input: ['src', 'projects/lib'],
        fileFormat: 'json',
        marker: '_',
        sort: true,
        unflat: true,
        defaultValue: 'missing',
        translationsPath: 'i18n',
        addMissingKeys: true,
        emitErrorOnExtraKeys: true,
      });
      expect(runners.runExtract).not.toHaveBeenCalled();
    });

    it(`GIVEN every option of the command by its alias
        WHEN the program runs
        THEN the runner gets the same config as with the long names`, async () => {
      await setup().run(
        'find',
        '-c',
        'transloco.config.js',
        '-i',
        'src',
        '-f',
        'pot',
        '-m',
        '_',
        '-s',
        '-u',
        '-d',
        'missing',
        '-p',
        'i18n',
        '-a',
        '-e',
      );

      expect(runners.runFind).toHaveBeenCalledExactlyOnceWith({
        command: 'find',
        config: 'transloco.config.js',
        input: ['src'],
        fileFormat: 'pot',
        marker: '_',
        sort: true,
        unflat: true,
        defaultValue: 'missing',
        translationsPath: 'i18n',
        addMissingKeys: true,
        emitErrorOnExtraKeys: true,
      });
    });

    it(`GIVEN no options
        WHEN the program runs
        THEN the config holds the command alone, leaving the rest to the config file`, async () => {
      await setup().run('find');

      expect(runners.runFind).toHaveBeenCalledExactlyOnceWith({
        command: 'find',
      });
    });
  });

  describe('validate', () => {
    it(`GIVEN several translation files
        WHEN the program runs
        THEN the runner gets all of them`, async () => {
      await setup().run('validate', 'i18n/en.json', 'i18n/es.json');

      expect(runners.runValidate).toHaveBeenCalledExactlyOnceWith([
        'i18n/en.json',
        'i18n/es.json',
      ]);
    });

    it(`GIVEN a runner that fails
        WHEN the program runs
        THEN the failure reaches the caller untouched`, async () => {
      const failure = new CliError('Found duplicate keys: a (en.json)');
      runners.runValidate.mockImplementationOnce(() => {
        throw failure;
      });

      await expect(setup().run('validate', 'en.json')).rejects.toBe(failure);
    });
  });

  describe('optimize', () => {
    it(`GIVEN the dist as an argument
        WHEN the program runs
        THEN the runner gets it along with the default comments key`, async () => {
      await setup().run('optimize', 'dist/app/i18n');

      expect(runners.runOptimize).toHaveBeenCalledExactlyOnceWith({
        dist: 'dist/app/i18n',
        commentsKey: 'comment',
      });
    });

    it(`GIVEN the dist as an option and a custom comments key
        WHEN the program runs
        THEN the runner gets both`, async () => {
      await setup().run('optimize', '--dist', 'dist/i18n', '-k', 'note');

      expect(runners.runOptimize).toHaveBeenCalledExactlyOnceWith({
        dist: 'dist/i18n',
        commentsKey: 'note',
      });
    });

    it(`GIVEN the option aliases
        WHEN the program runs
        THEN the runner gets the same options as with the long names`, async () => {
      await setup().run('optimize', '-d', 'dist/i18n', '--comments-key', 'c');

      expect(runners.runOptimize).toHaveBeenCalledExactlyOnceWith({
        dist: 'dist/i18n',
        commentsKey: 'c',
      });
    });

    it(`GIVEN no dist at all
        WHEN the program runs
        THEN it fails with a missing argument error and runs nothing`, async () => {
      const { run, output } = setup();

      await expect(run('optimize')).rejects.toMatchObject({ exitCode: 1 });

      expect(output.stderr).toContain(
        `error: missing required argument 'dist'`,
      );
      expectNoRunnerCalled();
    });

    it(`GIVEN the dist as both an argument and an option
        WHEN the program runs
        THEN it fails instead of picking one`, async () => {
      const { run, output } = setup();

      await expect(run('optimize', 'a', '--dist', 'b')).rejects.toMatchObject({
        exitCode: 1,
      });

      expect(output.stderr).toContain(
        `error: 'dist' was given both as an argument and through '--dist'`,
      );
      expectNoRunnerCalled();
    });
  });

  describe('scoped-libs', () => {
    it(`GIVEN every option of the command
        WHEN the program runs
        THEN the runner gets them`, async () => {
      await setup().run(
        'scoped-libs',
        '--watch',
        '--skip-gitignore',
        '--config',
        'transloco.config.js',
      );

      expect(runners.runScopedLibs).toHaveBeenCalledExactlyOnceWith({
        watch: true,
        skipGitignore: true,
        config: 'transloco.config.js',
      });
    });

    it(`GIVEN the option aliases
        WHEN the program runs
        THEN the runner gets the same options as with the long names`, async () => {
      await setup().run('scoped-libs', '-w', '-c', 'transloco.config.js');

      expect(runners.runScopedLibs).toHaveBeenCalledExactlyOnceWith({
        watch: true,
        config: 'transloco.config.js',
      });
    });

    it(`GIVEN no options
        WHEN the program runs
        THEN the runner gets none`, async () => {
      await setup().run('scoped-libs');

      expect(runners.runScopedLibs).toHaveBeenCalledExactlyOnceWith({});
    });
  });

  describe('strictness', () => {
    it.each([
      {
        scenario: 'an option no command knows',
        args: ['extract', '--frobnicate'],
        error: `error: unknown option '--frobnicate'`,
      },
      {
        scenario: 'a find only option on extract',
        args: ['extract', '--add-missing-keys'],
        error: `error: unknown option '--add-missing-keys'`,
      },
      {
        scenario: 'the alias of a find only option on extract',
        args: ['extract', '-e'],
        error: `error: unknown option '-e'`,
      },
      {
        scenario: 'the find only translations path on extract',
        args: ['extract', '--translations-path', 'i18n'],
        error: `error: unknown option '--translations-path'`,
      },
      {
        scenario: 'an extract only option on find',
        args: ['find', '--replace'],
        error: `error: unknown option '--replace'`,
      },
      {
        scenario: 'the extract only output on find',
        args: ['find', '--output', 'i18n'],
        error: `error: unknown option '--output'`,
      },
      {
        scenario: 'the extract only langs on find',
        args: ['find', '--langs', 'en'],
        error: `error: unknown option '--langs'`,
      },
      {
        scenario: 'a keys manager option on validate',
        args: ['validate', 'en.json', '--sort'],
        error: `error: unknown option '--sort'`,
      },
      {
        scenario: 'a camelCase spelling of an option',
        args: ['extract', '--removeExtraKeys'],
        error: `error: unknown option '--removeExtraKeys'`,
      },
      {
        scenario: 'an unknown command',
        args: ['translate'],
        error: `error: unknown command 'translate'`,
      },
      {
        scenario: 'an unknown program option',
        args: ['--frobnicate', 'extract'],
        error: `error: unknown option '--frobnicate'`,
      },
      {
        scenario: 'a program option after the command',
        args: ['extract', '--cwd', '.'],
        error: `error: unknown option '--cwd'`,
      },
      {
        scenario: 'validate without files',
        args: ['validate'],
        error: `error: missing required argument 'files'`,
      },
      {
        scenario: 'an argument extract does not take',
        args: ['extract', 'src'],
        error: `error: too many arguments for 'extract'`,
      },
      {
        scenario: 'a second dist for optimize',
        args: ['optimize', 'dist', 'other'],
        error: `error: too many arguments for 'optimize'`,
      },
      {
        scenario: 'an option missing its value',
        args: ['extract', '--output'],
        error: `error: option '-o, --output <path>' argument missing`,
      },
      {
        scenario: 'an unsupported file format',
        args: ['find', '--file-format', 'xliff'],
        error: `error: option '-f, --file-format <format>' argument 'xliff' is invalid. Allowed choices are json, pot.`,
      },
    ])(
      `GIVEN $scenario
       WHEN the program runs
       THEN it fails with a non-zero exit code and runs nothing`,
      async ({ args, error }) => {
        const { run, output } = setup();

        await expect(run(...args)).rejects.toMatchObject({ exitCode: 1 });

        expect(output.stderr).toContain(error);
        expect(output.stdout).toBe('');
        expectNoRunnerCalled();
      },
    );

    it(`GIVEN no command
        WHEN the program runs
        THEN it prints the help as an error and runs nothing`, async () => {
      const { run, output } = setup();

      await expect(run()).rejects.toMatchObject({ exitCode: 1 });

      expect(output.stderr).toContain('Usage: transloco [options] [command]');
      expectNoRunnerCalled();
    });
  });

  describe('repeated options', () => {
    const once = (flags: string) =>
      `error: option '${flags}' was given more than once.`;

    it.each([
      // extract
      ['extract', ['--project', 'a', '--project', 'b'], '--project <name>'],
      ['extract', ['-c', 'a', '--config', 'b'], '-c, --config <path>'],
      ['extract', ['-i', 'src/app', '-i', 'lib/src'], '-i, --input <paths>'],
      ['extract', ['--input', 'a', '--input', 'b'], '-i, --input <paths>'],
      ['extract', ['-o', 'a', '-o', 'b'], '-o, --output <path>'],
      ['extract', ['-f', 'json', '-f', 'pot'], '-f, --file-format <format>'],
      ['extract', ['-m', '_', '-m', 't'], '-m, --marker <name>'],
      ['extract', ['-d', 'a', '-d', 'b'], '-d, --default-value <value>'],
      // find
      ['find', ['--project', 'a', '--project', 'b'], '--project <name>'],
      ['find', ['-c', 'a', '-c', 'b'], '-c, --config <path>'],
      ['find', ['-i', 'a', '--input', 'b'], '-i, --input <paths>'],
      ['find', ['-f', 'json', '-f', 'json'], '-f, --file-format <format>'],
      ['find', ['-m', '_', '-m', 't'], '-m, --marker <name>'],
      ['find', ['-d', 'a', '-d', 'b'], '-d, --default-value <value>'],
      [
        'find',
        ['-p', 'a', '--translations-path', 'b'],
        '-p, --translations-path <path>',
      ],
      // optimize
      ['optimize', ['-d', 'a', '--dist', 'b'], '-d, --dist <path>'],
      ['optimize', ['dist', '-k', 'a', '-k', 'b'], '-k, --comments-key <key>'],
      // scoped-libs
      ['scoped-libs', ['-c', 'a', '--config', 'b'], '-c, --config <path>'],
    ])(
      `GIVEN the %s command and the arguments %j
       WHEN the program runs
       THEN it fails saying the option was given more than once and runs nothing`,
      async (command, args, flags) => {
        const { run, output } = setup();

        await expect(run(command, ...args)).rejects.toMatchObject({
          exitCode: 1,
        });

        expect(output.stderr).toContain(once(flags));
        expect(output.stdout).toBe('');
        expectNoRunnerCalled();
      },
    );

    it(`GIVEN the cwd program option twice
        WHEN the program runs
        THEN it fails before changing the directory or running the command`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});
      const { run, output } = setup();

      await expect(
        run('-C', os.tmpdir(), '--cwd', os.tmpdir(), 'extract'),
      ).rejects.toMatchObject({ exitCode: 1 });

      expect(output.stderr).toContain(once('-C, --cwd <dir>'));
      expect(chdir).not.toHaveBeenCalled();
      expectNoRunnerCalled();
    });

    it(`GIVEN the input option twice
        WHEN the program runs
        THEN the error points at the comma separated form`, async () => {
      const { run, output } = setup();

      await expect(
        run('extract', '-i', 'src/app', '-i', 'lib/src', '-R'),
      ).rejects.toMatchObject({ exitCode: 1 });

      expect(output.stderr).toContain(
        `error: option '-i, --input <paths>' was given more than once. Separate several paths with a comma instead, e.g. --input src/app,projects/ui/src`,
      );
      expectNoRunnerCalled();
    });

    it(`GIVEN flags without a value repeated
        WHEN the program runs
        THEN they are accepted as if given once`, async () => {
      await setup().run('extract', '-s', '--sort', '-u', '-u', '-r', '-r');

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
        sort: true,
        unflat: true,
        replace: true,
      });
    });

    it(`GIVEN the comments key given once, on top of its default
        WHEN the program runs
        THEN the default does not count as an occurrence`, async () => {
      await setup().run('optimize', 'dist', '--comments-key', 'note');

      expect(runners.runOptimize).toHaveBeenCalledExactlyOnceWith({
        dist: 'dist',
        commentsKey: 'note',
      });
    });

    it(`GIVEN an option of one command and the same option of another program run
        WHEN each program runs once
        THEN an occurrence is not carried over from one program to the next`, async () => {
      await setup().run('extract', '--output', 'a');
      await setup().run('extract', '--output', 'b');

      expect(runners.runExtract).toHaveBeenCalledTimes(2);
      expect(runners.runExtract).toHaveBeenLastCalledWith({
        command: 'extract',
        output: 'b',
      });
    });
  });

  describe('empty dist', () => {
    it.each([
      {
        scenario: 'an empty dist argument',
        args: ['optimize', ''],
        error: `error: 'dist' cannot be empty`,
      },
      {
        scenario: 'a blank dist argument',
        args: ['optimize', '  '],
        error: `error: 'dist' cannot be empty`,
      },
      {
        scenario: 'an empty dist option',
        args: ['optimize', '--dist', ''],
        error: `error: option '-d, --dist <path>' argument cannot be empty`,
      },
    ])(
      `GIVEN $scenario
       WHEN the program runs
       THEN it fails instead of optimizing the working directory`,
      async ({ args, error }) => {
        const { run, output } = setup();

        await expect(run(...args)).rejects.toMatchObject({ exitCode: 1 });

        expect(output.stderr).toContain(error);
        expectNoRunnerCalled();
      },
    );
  });

  describe('empty values', () => {
    const empty = (flags: string) =>
      `error: option '${flags}' argument cannot be empty`;

    it.each([
      // extract
      ['extract', ['--project', ''], empty('--project <name>')],
      ['extract', ['-c', ''], empty('-c, --config <path>')],
      ['extract', ['-i', ''], empty('-i, --input <paths>')],
      ['extract', ['--input='], empty('-i, --input <paths>')],
      ['extract', ['--input', '  '], empty('-i, --input <paths>')],
      ['extract', ['-i', '', '-o', 'out', '-R'], empty('-i, --input <paths>')],
      ['extract', ['-o', ''], empty('-o, --output <path>')],
      ['extract', ['--output=', '-i', 'src'], empty('-o, --output <path>')],
      ['extract', ['-m', ''], empty('-m, --marker <name>')],
      ['extract', ['-m', ' '], empty('-m, --marker <name>')],
      ['extract', ['-l', ''], empty('-l, --langs <langs...>')],
      ['extract', ['-l', 'en', ''], empty('-l, --langs <langs...>')],
      ['extract', ['-l', 'en', '-l', ' '], empty('-l, --langs <langs...>')],
      [
        'extract',
        ['-f', ''],
        `error: option '-f, --file-format <format>' argument '' is invalid. Allowed choices are json, pot.`,
      ],
      // find
      ['find', ['--project', ''], empty('--project <name>')],
      ['find', ['-c', ' '], empty('-c, --config <path>')],
      ['find', ['-i', '', '-p', 'out', '-a'], empty('-i, --input <paths>')],
      ['find', ['-m', ''], empty('-m, --marker <name>')],
      ['find', ['-p', ''], empty('-p, --translations-path <path>')],
      [
        'find',
        ['--file-format', ''],
        `error: option '-f, --file-format <format>' argument '' is invalid. Allowed choices are json, pot.`,
      ],
      // optimize
      ['optimize', ['dist', '-k', ''], empty('-k, --comments-key <key>')],
      ['optimize', ['-d', ' '], empty('-d, --dist <path>')],
      // scoped-libs
      ['scoped-libs', ['-c', ''], empty('-c, --config <path>')],
      ['scoped-libs', ['--config='], empty('-c, --config <path>')],
    ])(
      `GIVEN the %s command and the arguments %j
       WHEN the program runs
       THEN it fails on the empty value and runs nothing`,
      async (command, args, error) => {
        const { run, output } = setup();

        await expect(run(command, ...args)).rejects.toMatchObject({
          exitCode: 1,
        });

        expect(output.stderr).toContain(error);
        expect(output.stdout).toBe('');
        expectNoRunnerCalled();
      },
    );

    it(`GIVEN an empty cwd program option
        WHEN the program runs
        THEN it fails without changing the directory or running the command`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});
      const { run, output } = setup();

      await expect(run('-C', '', 'extract')).rejects.toMatchObject({
        exitCode: 1,
      });

      expect(output.stderr).toContain(empty('-C, --cwd <dir>'));
      expect(chdir).not.toHaveBeenCalled();
      expectNoRunnerCalled();
    });

    it.each([
      ['a trailing comma', 'src,'],
      ['a leading comma', ',src'],
      ['two commas in a row', 'a,,b'],
      ['a blank path between commas', 'a, ,b'],
      ['nothing but a comma', ','],
    ])(
      `GIVEN an input with %s
       WHEN the program runs
       THEN it fails on the empty path and runs nothing`,
      async (_, input) => {
        for (const command of ['extract', 'find']) {
          const { run, output } = setup();

          await expect(run(command, '--input', input)).rejects.toMatchObject({
            exitCode: 1,
          });

          expect(output.stderr).toContain(
            `error: option '-i, --input <paths>' argument '${input}' holds an empty path. Separate the paths with a single comma, e.g. --input src/app,projects/ui/src`,
          );
        }

        expectNoRunnerCalled();
      },
    );

    it(`GIVEN an input with a space after its comma
        WHEN the program runs
        THEN the paths are handed over as they are, untrimmed, just like the legacy bin does`, async () => {
      await setup().run('extract', '--input', 'a, b');

      expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
        command: 'extract',
        input: ['a', ' b'],
      });
    });

    it.each([
      ['extract', 'runExtract', ''],
      ['extract', 'runExtract', ' '],
      ['find', 'runFind', ''],
    ] as const)(
      `GIVEN the %s command with the default value %j
       WHEN the program runs
       THEN it is accepted, as an empty default value for the generated keys is a choice`,
      async (command, runner, defaultValue) => {
        await setup().run(command, '--default-value', defaultValue);

        expect(runners[runner]).toHaveBeenCalledExactlyOnceWith({
          command,
          defaultValue,
        });
      },
    );
  });

  describe('how options are written', () => {
    const combined = (flags: string, token: string, forms: string) =>
      `error: option '${flags}' takes a value, so it can't share a dash with anything else ('${token}'): write ${forms}`;
    const config = `'-c <path>' or '--config=<path>'`;
    const output = `'-o <path>' or '--output=<path>'`;

    it.each([
      // A value option directly followed by an option: the value is missing
      {
        args: ['extract', '-R', '-c', '-s'],
        error: `error: option '-c, --config <path>' argument missing ('-s' is an option, a value that starts with a dash is written as --config=-s)`,
      },
      {
        args: ['extract', '--project', '-R'],
        error: `error: option '--project <name>' argument missing ('-R' is an option, a value that starts with a dash is written as --project=-R)`,
      },
      {
        args: ['extract', '-d', '-R'],
        error: `error: option '-d, --default-value <value>' argument missing ('-R' is an option`,
      },
      {
        args: ['extract', '-o', '-R'],
        error: `error: option '-o, --output <path>' argument missing ('-R' is an option`,
      },
      {
        args: ['extract', '-m', '--sort'],
        error: `error: option '-m, --marker <name>' argument missing ('--sort' is an option`,
      },
      {
        args: ['extract', '-l', '-R'],
        error: `error: option '-l, --langs <langs...>' argument missing ('-R' is an option`,
      },
      {
        args: ['extract', '-o', '-sR'],
        error: `error: option '-o, --output <path>' argument missing ('-sR' is an option`,
      },
      {
        args: ['extract', '--output', '--input=src'],
        error: `error: option '-o, --output <path>' argument missing ('--input=src' is an option`,
      },
      {
        args: ['extract', '--output', '--'],
        error: `error: option '-o, --output <path>' argument missing ('--' is an option`,
      },
      {
        args: ['extract', '--project', '--cwd'],
        error: `error: option '--project <name>' argument missing ('--cwd' is an option`,
      },
      {
        args: ['find', '-a', '-c', '-s'],
        error: `error: option '-c, --config <path>' argument missing ('-s' is an option`,
      },
      {
        args: ['find', '-p', '-e'],
        error: `error: option '-p, --translations-path <path>' argument missing ('-e' is an option`,
      },
      {
        args: ['optimize', 'dist', '-k', '-d'],
        error: `error: option '-k, --comments-key <key>' argument missing ('-d' is an option`,
      },
      {
        args: ['scoped-libs', '-c', '--watch'],
        error: `error: option '-c, --config <path>' argument missing ('--watch' is an option`,
      },
      {
        args: ['-C', '-V', 'extract'],
        error: `error: option '-C, --cwd <dir>' argument missing ('-V' is an option`,
      },
      // A value glued to the letter of its option
      {
        args: ['extract', '-cpath-to-config'],
        error: combined('-c, --config <path>', '-cpath-to-config', config),
      },
      {
        args: ['extract', '-oout2'],
        error: combined(
          '-o, --output <path>',
          '-oout2',
          `'-o <path>' or '--output=<path>'`,
        ),
      },
      {
        args: ['extract', '-les'],
        error: combined(
          '-l, --langs <langs...>',
          '-les',
          `'-l <langs...>' or '--langs=<langs...>'`,
        ),
      },
      {
        args: ['optimize', 'dist', '-kd'],
        error: combined(
          '-k, --comments-key <key>',
          '-kd',
          `'-k <key>' or '--comments-key=<key>'`,
        ),
      },
      // A short option written with "="
      {
        args: ['extract', '-R', '-c=transloco.config.js'],
        error: combined(
          '-c, --config <path>',
          '-c=transloco.config.js',
          config,
        ),
      },
      {
        args: ['extract', '-m=mk'],
        error: combined(
          '-m, --marker <name>',
          '-m=mk',
          `'-m <name>' or '--marker=<name>'`,
        ),
      },
      {
        args: ['extract', '-d=DV'],
        error: combined(
          '-d, --default-value <value>',
          '-d=DV',
          `'-d <value>' or '--default-value=<value>'`,
        ),
      },
      {
        args: ['find', '-a', '-c=transloco.config.js'],
        error: combined(
          '-c, --config <path>',
          '-c=transloco.config.js',
          config,
        ),
      },
      {
        args: ['optimize', 'dist', '-k=note'],
        error: combined(
          '-k, --comments-key <key>',
          '-k=note',
          `'-k <key>' or '--comments-key=<key>'`,
        ),
      },
      {
        args: ['-C=apps', 'extract'],
        error: combined(
          '-C, --cwd <dir>',
          '-C=apps',
          `'-C <dir>' or '--cwd=<dir>'`,
        ),
      },
      // An option taking a value among the letters of a cluster
      {
        args: ['extract', '-Rc', '-s'],
        error: combined('-c, --config <path>', '-Rc', config),
      },
      {
        args: ['extract', '-Ri', 'src/app'],
        error: combined(
          '-i, --input <paths>',
          '-Ri',
          `'-i <paths>' or '--input=<paths>'`,
        ),
      },
      {
        args: ['extract', '-sRo', 'out2'],
        error: combined('-o, --output <path>', '-sRo', output),
      },
      {
        args: ['extract', '-sc=transloco.config.js'],
        error: combined(
          '-c, --config <path>',
          '-sc=transloco.config.js',
          config,
        ),
      },
      // Letters that are all short options are a cluster, even when they
      // also read as the start of a name
      {
        args: ['extract', '-sor'],
        error: `${combined('-o, --output <path>', '-sor', output)} (or did you mean '--sort'?)\n`,
      },
      {
        args: ['extract', '-so', 'out2'],
        error: `${combined('-o, --output <path>', '-so', output)} (or did you mean '--sort'?)\n`,
      },
      {
        args: ['find', '-ad', 'DV'],
        error: `${combined(
          '-d, --default-value <value>',
          '-ad',
          `'-d <value>' or '--default-value=<value>'`,
        )} (or did you mean '--add-missing-keys'?)\n`,
      },
      {
        args: ['extract', '-Rs', '-sd', 'TODO'],
        error: `${combined(
          '-d, --default-value <value>',
          '-sd',
          `'-d <value>' or '--default-value=<value>'`,
        )}\n`,
      },
      // A program option isn't offered where it can't be given
      {
        args: ['extract', '-cwd'],
        error: combined('-c, --config <path>', '-cwd', config),
      },
      // A long option written with one dash, in any of its spellings
      {
        args: ['extract', '-output'],
        error: `error: unknown option '-output' (did you mean '--output'?)`,
      },
      {
        args: ['extract', '-R', '-out=i18n'],
        error: `error: unknown option '-out=i18n' (did you mean '--output'?)`,
      },
      {
        args: ['extract', '-defaultValue=TODO'],
        error: `error: unknown option '-defaultValue=TODO' (did you mean '--default-value'?)`,
      },
      {
        args: ['extract', '-default-value=TODO'],
        error: `error: unknown option '-default-value=TODO' (did you mean '--default-value'?)`,
      },
      {
        args: ['extract', '-default=TODO'],
        error: `error: unknown option '-default=TODO' (did you mean '--default-value'?)`,
      },
      {
        args: ['extract', '-lang=en'],
        error: `error: unknown option '-lang=en' (did you mean '--langs'?)`,
      },
      {
        args: ['extract', '-langs'],
        error: `error: unknown option '-langs' (did you mean '--langs'?)`,
      },
      {
        args: ['extract', '-R', '--langs', 'es', '-sorted'],
        error: `error: unknown option '-sorted' (did you mean '--sort'?)`,
      },
      {
        args: ['extract', '-re'],
        error: `error: unknown option '-re' (did you mean '--replace' or '--remove-extra-keys'?)`,
      },
      {
        args: ['find', '-addMissingKeys'],
        error: `error: unknown option '-addMissingKeys' (did you mean '--add-missing-keys'?)`,
      },
      {
        args: ['find', '-a', '-emitErrorOnExtraKeys'],
        error: `error: unknown option '-emitErrorOnExtraKeys' (did you mean '--emit-error-on-extra-keys'?)`,
      },
      {
        args: ['optimize', 'dist', '-key=note'],
        error: `error: unknown option '-key=note' (did you mean '--comments-key'?)`,
      },
      {
        args: ['optimize', '-dist=dist'],
        error: `error: unknown option '-dist=dist' (did you mean '--dist'?)`,
      },
      {
        args: ['extract', '-help'],
        error: `error: unknown option '-help' (did you mean '--help'?)`,
      },
      {
        args: ['-cwd', 'apps', 'extract'],
        error: `error: unknown option '-cwd' (did you mean '--cwd'?)`,
      },
      // A letter that is no option at all is named
      {
        args: ['extract', '-sX'],
        error: `error: unknown option '-sX' ('X' is not an option of extract)\n`,
      },
      {
        args: ['extract', '-sue'],
        error: `error: unknown option '-sue' ('e' is not an option of extract)\n`,
      },
      {
        args: ['-VX', 'extract'],
        error: `error: unknown option '-VX' ('X' is not an option of transloco)\n`,
      },
      // A flag takes no value
      {
        args: ['extract', '-s=false'],
        error: `error: unknown option '-s=false' ('-s' takes no value)\n`,
      },
      {
        args: ['extract', '-su=true'],
        error: `error: unknown option '-su=true' ('-su' takes no value)\n`,
      },
      // The help letter is a flag like the others: not next to an option
      // taking a value, an unknown letter or a value of its own
      {
        args: ['extract', '-hc'],
        error: combined('-c, --config <path>', '-hc', config),
      },
      {
        args: ['extract', '-ch'],
        error: combined('-c, --config <path>', '-ch', config),
      },
      {
        args: ['extract', '-sH'],
        error: `error: unknown option '-sH' ('H' is not an option of extract)\n`,
      },
      {
        args: ['extract', '-hX'],
        error: `error: unknown option '-hX' ('X' is not an option of extract)\n`,
      },
      {
        args: ['extract', '-h=1'],
        error: `error: unknown option '-h=1' ('-h' takes no value)\n`,
      },
      {
        args: ['extract', '-o', '-hs'],
        error: `error: option '-o, --output <path>' argument missing ('-hs' is an option`,
      },
    ])(
      `GIVEN the arguments $args
       WHEN the program runs
       THEN it is rejected instead of running with a value nobody typed`,
      async ({ args, error }) => {
        const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});
        const { run, output } = setup();

        await expect(run(...args)).rejects.toMatchObject({ exitCode: 1 });

        expect(output.stderr).toContain(error);
        expect(output.stdout).toBe('');
        expect(chdir).not.toHaveBeenCalled();
        expectNoRunnerCalled();
      },
    );

    it.each([
      {
        scenario: 'two flags behind one dash',
        args: ['extract', '-su'],
        config: { sort: true, unflat: true },
      },
      {
        scenario: 'the same two flags the other way around',
        args: ['extract', '-us'],
        config: { sort: true, unflat: true },
      },
      {
        scenario: 'every flag of the command behind one dash',
        args: ['extract', '-RusR', '-r'],
        config: {
          sort: true,
          unflat: true,
          replace: true,
          removeExtraKeys: true,
        },
      },
      {
        scenario: 'a flag repeated inside a cluster',
        args: ['extract', '-ss'],
        config: { sort: true },
      },
      {
        scenario: 'a cluster of flags, then an option with its value',
        args: ['extract', '-sR', '-o', 'out2'],
        config: { output: 'out2', sort: true, removeExtraKeys: true },
      },
      {
        scenario: 'a value starting with a dash, written with "="',
        args: ['extract', '--default-value=-R'],
        config: { defaultValue: '-R' },
      },
      {
        scenario: 'a value that is the name of an option, written with "="',
        args: ['extract', '--output=--sort'],
        config: { output: '--sort' },
      },
      {
        scenario: 'a value starting with "=" after a long option',
        args: ['extract', '--default-value', '=x'],
        config: { defaultValue: '=x' },
      },
      {
        scenario: 'a value starting with "=" after "="',
        args: ['extract', '--default-value==x'],
        config: { defaultValue: '=x' },
      },
      {
        scenario: 'a value starting with "=" after a short option',
        args: ['extract', '-d', '=x'],
        config: { defaultValue: '=x' },
      },
      {
        scenario: 'a negative number for a value',
        args: ['extract', '--default-value', '-1'],
        config: { defaultValue: '-1' },
      },
      {
        scenario: 'a word starting with a dash that is no option, for a value',
        args: ['extract', '-d', '-TODO-'],
        config: { defaultValue: '-TODO-' },
      },
      {
        scenario: 'a single dash for a value',
        args: ['extract', '--default-value', '-'],
        config: { defaultValue: '-' },
      },
      {
        scenario: 'a flag right after the values of --langs',
        args: ['extract', '-l', 'en', '-R'],
        config: { langs: ['en'], removeExtraKeys: true },
      },
      {
        scenario: 'several values of --langs followed by a flag',
        args: ['extract', '--langs', 'en', 'es', '--sort'],
        config: { langs: ['en', 'es'], sort: true },
      },
    ])(
      `GIVEN $scenario
       WHEN the program runs
       THEN the command gets exactly what was typed`,
      async ({ args, config }) => {
        await setup().run(...args);

        expect(runners.runExtract).toHaveBeenCalledExactlyOnceWith({
          command: 'extract',
          ...config,
        });
      },
    );

    it(`GIVEN the flags of find behind one dash
        WHEN the program runs
        THEN both are on`, async () => {
      await setup().run('find', '-ae');

      expect(runners.runFind).toHaveBeenCalledExactlyOnceWith({
        command: 'find',
        addMissingKeys: true,
        emitErrorOnExtraKeys: true,
      });
    });

    it(`GIVEN the help flag inside a cluster of flags
        WHEN the program runs
        THEN the help of the command is printed and nothing runs`, async () => {
      const { run, output } = setup();

      await expect(run('extract', '-sh')).rejects.toMatchObject({
        exitCode: 0,
      });

      expect(output.stdout).toContain('Usage: transloco extract [options]');
      expectNoRunnerCalled();
    });

    it.each([
      ['validate', '-1.json'],
      ['validate', '-x.json'],
      ['optimize', '-dist-folder'],
    ])(
      `GIVEN "%s %s", an argument that starts with a dash
       WHEN the program runs
       THEN it is taken for an unknown option, as it always was`,
      async (command, argument) => {
        const { run, output } = setup();

        await expect(run(command, argument)).rejects.toMatchObject({
          exitCode: 1,
        });

        expect(output.stderr).toContain(`error: unknown option '${argument}'`);
        expectNoRunnerCalled();
      },
    );

    it.each([
      {
        scenario: 'a lone dash',
        args: ['validate', '-'],
        files: ['-'],
      },
      {
        scenario: 'an argument starting with a dash after "--"',
        args: ['validate', '--', '-1.json', '-s'],
        files: ['-1.json', '-s'],
      },
      // Commander takes a negative number for an argument, not for an option
      {
        scenario: 'a negative number',
        args: ['validate', '-5', '-1.5'],
        files: ['-5', '-1.5'],
      },
    ])(
      `GIVEN $scenario for a file
       WHEN validate runs
       THEN it is handed over as a file`,
      async ({ args, files }) => {
        await setup().run(...args);

        expect(runners.runValidate).toHaveBeenCalledExactlyOnceWith(files);
      },
    );
  });

  describe('grammar of short options, on every command', () => {
    type Walked = {
      name(): string;
      options: ReturnType<typeof createProgram>['options'];
      registeredArguments: ReturnType<
        typeof createProgram
      >['registeredArguments'];
      commands: readonly Walked[];
    };

    interface CommandOptions {
      /** The commands leading here, none for the program. */
      path: string[];
      values: Array<{
        name: string;
        long: string;
        short?: string;
        value: string;
      }>;
      flags: Array<{ key: string; short?: string }>;
      /** What the command needs next to its options to be runnable. */
      operands: string[];
    }

    /** The options of every command of the tree, the program included. */
    function readCommands(
      command: Walked,
      path: string[] = [],
    ): CommandOptions[] {
      const own = command.options.filter(
        (option) => option.long !== undefined && option.name() !== 'version',
      );

      return [
        {
          path,
          values: own
            .filter((option) => option.required || option.optional)
            .map((option) => ({
              name: option.name(),
              long: option.long as string,
              short: option.short,
              value: option.argChoices?.[0] ?? 'value',
            })),
          flags: own
            .filter((option) => !option.required && !option.optional)
            .map((option) => ({
              key: option.attributeName(),
              short: option.short,
            })),
          operands: command.registeredArguments.map(
            (argument) => `${argument.name()}-operand`,
          ),
        },
        ...command.commands.flatMap((subcommand) =>
          readCommands(subcommand, [...path, subcommand.name()]),
        ),
      ];
    }

    const commands = readCommands(createProgram());
    const title = ({ path }: CommandOptions) => path.join(' ') || 'the program';
    /** A program option goes before a command, a command option after its command and operands. */
    const argsFor = ({ path, operands }: CommandOptions, tokens: string[]) =>
      path.length
        ? [...path, ...operands, ...tokens]
        : [...tokens, 'validate', 'en.json'];

    it(`GIVEN the real program
        WHEN its commands are walked
        THEN every command and the program itself are found`, () => {
      expect(commands.map(title)).toEqual(
        expect.arrayContaining([
          'the program',
          'extract',
          'find',
          'validate',
          'optimize',
          'scoped-libs',
        ]),
      );
    });

    it.each(commands.map((command) => [title(command), command] as const))(
      `GIVEN %s
       WHEN each of its options taking a value is glued to something
       THEN every such command line is rejected and names the option`,
      async (_, command) => {
        vi.spyOn(process, 'chdir').mockImplementation(() => {});
        const [flag] = command.flags.filter(({ short }) => short);

        for (const { long, short, value } of command.values) {
          const tokens = [
            // the long name behind one dash, alone and with "="
            [long.slice(1)],
            [`${long.slice(1)}=${value}`],
            ...(short
              ? [
                  // the value attached to the letter, with and without "="
                  [`${short}${value}`],
                  [`${short}=${value}`],
                  // the letter in a cluster with a flag, either way around
                  ...(flag?.short
                    ? [
                        [`${flag.short}${short.slice(1)}`, value],
                        [`${short}${flag.short.slice(1)}`, value],
                      ]
                    : []),
                ]
              : []),
          ];

          for (const typed of tokens) {
            const { run, output } = setup();

            await expect(
              run(...argsFor(command, typed)),
              JSON.stringify(typed),
            ).rejects.toMatchObject({ exitCode: 1 });

            // Either the long option that was meant, or the option that can't
            // share its dash. A cluster may read as another name, e.g. `-so`.
            expect(output.stderr, JSON.stringify(typed)).toMatch(
              /did you mean '--|takes a value, so it can't share a dash/,
            );
            // The name in full always gets its own option suggested
            if (typed[0].startsWith(long.slice(1))) {
              expect(output.stderr, JSON.stringify(typed)).toContain(
                `'${long}'`,
              );
            }
            expectNoRunnerCalled();
          }
        }
      },
    );

    it.each(
      commands
        .filter(({ flags }) => flags.filter(({ short }) => short).length > 1)
        .map((command) => [title(command), command] as const),
    )(
      `GIVEN %s
       WHEN all of its flags are written behind one dash, in either order
       THEN the command runs with every one of them on`,
      async (_, command) => {
        const flags = command.flags.filter(({ short }) => short);
        const letters = flags.map(({ short }) => (short as string).slice(1));

        for (const cluster of [letters, [...letters].reverse()]) {
          vi.clearAllMocks();

          await setup().run(...argsFor(command, [`-${cluster.join('')}`]));

          const [ran] = Object.values(runners).filter(
            (runner) => runner.mock.calls.length > 0,
          );

          expect(ran).toHaveBeenCalledOnce();
          expect(ran.mock.calls[0][0]).toMatchObject(
            Object.fromEntries(flags.map(({ key }) => [key, true])),
          );
        }
      },
    );
  });

  describe('the help letter behind one dash, on every command', () => {
    // Read off the real program, the commands without a flag of their own included
    const commands = everyCommand(createProgram()).map((command) => {
      const names: string[] = [];

      for (
        let current: typeof command | null = command;
        current;
        current = current.parent
      ) {
        names.unshift(current.name());
      }

      const letter = (option?: { short?: string }) => option?.short?.slice(1);
      const takesValue = (option: (typeof command.options)[number]) =>
        Boolean(option.required || option.optional);
      const letters = (takingValue: boolean) =>
        command.options
          .filter((option) => takesValue(option) === takingValue)
          .flatMap((option) => letter(option) ?? []);

      return {
        names,
        // The help option is the one commander shows without it being declared
        help: letter(
          command
            .createHelp()
            .visibleOptions(command)
            .find((option) => !command.options.includes(option)),
        ) as string,
        version: letter(
          command.options.find((option) => option.name() === 'version'),
        ),
        flags: letters(false),
        values: letters(true),
        operands: command.registeredArguments.map(
          (argument) => `${argument.name()}-operand`,
        ),
      };
    });
    type Walked = (typeof commands)[number];
    /** A program option goes before a command, a command option after its command and operands. */
    const argsFor = ({ names, operands }: Walked, tokens: string[]) =>
      names.length > 1
        ? [...names.slice(1), ...operands, ...tokens]
        : [...tokens, 'validate', 'en.json'];

    async function printed(command: Walked, tokens: string[]) {
      vi.clearAllMocks();

      const { run, output } = setup();

      await expect(
        run(...argsFor(command, tokens)),
        JSON.stringify(tokens),
      ).rejects.toMatchObject({ exitCode: 0 });

      expect(output.stderr, JSON.stringify(tokens)).toBe('');
      expectNoRunnerCalled();

      return output.stdout;
    }

    it(`GIVEN the real program
        WHEN its commands are walked
        THEN every command and the program itself are found, each with a help letter`, () => {
      expect(commands.map(({ names }) => names.join(' '))).toEqual([
        'transloco',
        'transloco extract',
        'transloco find',
        'transloco validate',
        'transloco optimize',
        'transloco scoped-libs',
      ]);
      expect(commands.map(({ help }) => help)).toEqual(commands.map(() => 'h'));
    });

    it.each(
      commands.map((command) => [command.names.join(' '), command] as const),
    )(
      `GIVEN %s
       WHEN the help letter shares a dash with its flags, in every position
       THEN it prints what the same flags print when they are typed apart, and nothing runs`,
      async (_, command) => {
        const { help, flags, version: versionLetter } = command;
        const clusters = [
          [help, help],
          ...flags.flatMap((flag) => [
            [help, flag],
            [flag, help],
          ]),
          ...[...flags, help].map((_, position) => [
            ...flags.slice(0, position),
            help,
            ...flags.slice(position),
          ]),
        ];
        const usage = await printed(command, [`-${help}`]);

        expect(usage).toMatch(
          new RegExp(`^Usage: ${command.names.join(' ')} `),
        );

        for (const cluster of clusters) {
          const together = await printed(command, [`-${cluster.join('')}`]);
          const apart = await printed(
            command,
            cluster.map((one) => `-${one}`),
          );

          expect(together, cluster.join('')).toBe(apart);
          // The version is printed as soon as it is read, before the help
          // is looked for: it wins in either order
          expect(together, cluster.join('')).toBe(
            versionLetter && cluster.includes(versionLetter)
              ? `${version}\n`
              : usage,
          );
        }
      },
    );

    it.each(
      commands.map((command) => [command.names.join(' '), command] as const),
    )(
      `GIVEN %s
       WHEN the help letter shares a dash with an option taking a value or with an unknown letter
       THEN it is rejected, whichever comes first`,
      async (_, command) => {
        vi.spyOn(process, 'chdir').mockImplementation(() => {});
        const { help, values } = command;
        const name = command.names.at(-1);
        const rejected = [
          ...values.flatMap((value) =>
            [`-${help}${value}`, `-${value}${help}`].map((token) => ({
              token,
              error: `takes a value, so it can't share a dash with anything else ('${token}')`,
            })),
          ),
          ...[`-${help}X`, `-X${help}`].map((token) => ({
            token,
            error: `error: unknown option '${token}' ('X' is not an option of ${name})`,
          })),
        ];

        for (const { token, error } of rejected) {
          vi.clearAllMocks();

          const { run, output } = setup();

          await expect(
            run(...argsFor(command, [token])),
            token,
          ).rejects.toMatchObject({ exitCode: 1 });

          expect(output.stderr, token).toContain(error);
          expect(output.stdout, token).toBe('');
          expectNoRunnerCalled();
        }
      },
    );
  });

  describe('rules of every option taking a value', () => {
    /** The only options whose value may be empty. */
    const emptyValueAllowed = ['default-value'];

    interface ValueOption {
      /** The commands leading to the option, none for a program option. */
      path: string[];
      name: string;
      flag: string;
      flags: string;
      variadic: boolean;
      value: string;
    }

    type Walked = {
      name(): string;
      options: ReturnType<typeof createProgram>['options'];
      commands: readonly Walked[];
    };

    /** Every option taking a value, of the command and of all the commands below it. */
    function valueOptions(command: Walked, path: string[] = []): ValueOption[] {
      return [
        ...command.options
          .filter((option) => option.required || option.optional)
          .map((option) => ({
            path,
            name: option.name(),
            flag: (option.long ?? option.short) as string,
            flags: option.flags,
            variadic: option.variadic,
            value: option.argChoices?.[0] ?? 'value',
          })),
        ...command.commands.flatMap((subcommand) =>
          valueOptions(subcommand, [...path, subcommand.name()]),
        ),
      ];
    }

    /** A program option goes before a command, a command option after its own. */
    function argsFor({ path }: ValueOption, optionArgs: string[]) {
      return path.length
        ? [...path, ...optionArgs]
        : [...optionArgs, 'validate', 'en.json'];
    }

    // Read off the real program, so a command or an option added to it is
    // held to the rules without anyone having to remember this spec.
    const discovered = valueOptions(createProgram());
    const title = ({ path, flags }: ValueOption) => [...path, flags].join(' ');

    it(`GIVEN the real program
        WHEN its commands are walked
        THEN the options of every command and the program option are found`, () => {
      const found = discovered.map(({ path, name }) =>
        [...path, name].join(' '),
      );

      expect(found).toEqual(
        expect.arrayContaining([
          'cwd',
          'extract input',
          'extract langs',
          'find translations-path',
          'optimize dist',
          'optimize comments-key',
          'scoped-libs config',
        ]),
      );
      expect(found.length).toBeGreaterThanOrEqual(19);
    });

    it.each(discovered.map((option) => [title(option), option] as const))(
      `GIVEN "%s" twice
       WHEN the program runs
       THEN it is rejected, unless the option collects its values`,
      async (_, option) => {
        vi.spyOn(process, 'chdir').mockImplementation(() => {});
        const { run, output } = setup();
        const running = run(
          ...argsFor(option, [
            option.flag,
            option.value,
            option.flag,
            option.value,
          ]),
        );

        if (option.variadic) {
          await expect(running).resolves.toBeDefined();
        } else {
          await expect(running).rejects.toMatchObject({ exitCode: 1 });
          expect(output.stderr).toContain(
            `error: option '${option.flags}' was given more than once.`,
          );
          expectNoRunnerCalled();
        }
      },
    );

    it.each(discovered.map((option) => [title(option), option] as const))(
      `GIVEN "%s" with an empty and with a blank value
       WHEN the program runs
       THEN it is rejected, unless an empty value is a choice for that option`,
      async (_, option) => {
        for (const value of ['', '  ']) {
          const { run, output } = setup();
          const running = run(...argsFor(option, [option.flag, value]));

          if (emptyValueAllowed.includes(option.name)) {
            await expect(running).resolves.toBeDefined();
          } else {
            await expect(running).rejects.toMatchObject({ exitCode: 1 });
            // Commander's own check of the choices comes first, where there are any
            expect(output.stderr).toMatch(
              /argument cannot be empty|argument ' *' is invalid/,
            );
            expect(output.stderr).toContain(`option '${option.flags}'`);
          }
        }
      },
    );
  });

  describe('--cwd', () => {
    let dir: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-cwd-'));
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it(`GIVEN an existing directory
        WHEN the program runs a command
        THEN the working directory is changed before the runner is loaded`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});

      await setup().run('--cwd', dir, 'validate', 'en.json');

      expect(chdir).toHaveBeenCalledExactlyOnceWith(dir);
      expect(chdir.mock.invocationCallOrder[0]).toBeLessThan(
        runners.runValidate.mock.invocationCallOrder[0],
      );
    });

    it(`GIVEN the alias
        WHEN the program runs a command
        THEN the working directory is changed just the same`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});

      await setup().run('-C', dir, 'extract');

      expect(chdir).toHaveBeenCalledExactlyOnceWith(dir);
      expect(runners.runExtract).toHaveBeenCalledOnce();
    });

    it(`GIVEN a directory that does not exist
        WHEN the program runs a command
        THEN it fails naming the directory and runs nothing`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});
      const missing = path.join(dir, 'missing');
      const { run, output } = setup();

      await expect(run('--cwd', missing, 'extract')).rejects.toMatchObject({
        exitCode: 1,
      });

      expect(output.stderr).toContain(
        `error: the --cwd directory does not exist: ${missing}`,
      );
      expect(chdir).not.toHaveBeenCalled();
      expectNoRunnerCalled();
    });

    it(`GIVEN a file instead of a directory
        WHEN the program runs a command
        THEN it fails the same way`, async () => {
      const file = path.join(dir, 'en.json');
      fs.writeFileSync(file, '{}');
      const { run, output } = setup();

      await expect(run('--cwd', file, 'extract')).rejects.toMatchObject({
        exitCode: 1,
      });

      expect(output.stderr).toContain('the --cwd directory does not exist');
      expectNoRunnerCalled();
    });

    it(`GIVEN no cwd option
        WHEN the program runs a command
        THEN the working directory is left alone`, async () => {
      const chdir = vi.spyOn(process, 'chdir').mockImplementation(() => {});

      await setup().run('extract');

      expect(chdir).not.toHaveBeenCalled();
    });
  });

  describe('--version', () => {
    it.each(['--version', '-V'])(
      `GIVEN the %s flag
       WHEN the program runs
       THEN it prints the version of the package and runs nothing`,
      async (flag) => {
        const { run, output } = setup();

        await expect(run(flag)).rejects.toMatchObject({ exitCode: 0 });

        expect(output.stdout).toBe(`${version}\n`);
        expectNoRunnerCalled();
      },
    );
  });

  describe('--help', () => {
    it(`GIVEN the help flag without a command
        WHEN the program runs
        THEN it lists every command and the program options`, async () => {
      const { run, output } = setup();

      await expect(run('--help')).rejects.toMatchObject({ exitCode: 0 });

      for (const expected of [
        'Usage: transloco [options] [command]',
        'extract [options]',
        'find [options]',
        'validate <files...>',
        'optimize [options] [dist]',
        'scoped-libs [options]',
        'help [command]',
        '-V, --version',
        '-C, --cwd <dir>',
        '-h, --help',
      ]) {
        expect(unwrap(output.stdout)).toContain(expected);
      }
      expectNoRunnerCalled();
    });

    it.each([
      {
        command: 'extract',
        expected: [
          'Usage: transloco extract [options]',
          '--project <name>',
          '-c, --config <path>',
          '-i, --input <paths>',
          '-o, --output <path>',
          '-l, --langs <langs...>',
          '-f, --file-format <format>',
          '(choices: "json", "pot")',
          '-m, --marker <name>',
          '-r, --replace',
          '-R, --remove-extra-keys',
          '-s, --sort',
          '-u, --unflat',
          '-d, --default-value <value>',
          '-h, --help',
        ],
        unexpected: [
          '--add-missing-keys',
          '--emit-error-on-extra-keys',
          '--translations-path',
        ],
      },
      {
        command: 'find',
        expected: [
          'Usage: transloco find [options]',
          '--project <name>',
          '-c, --config <path>',
          '-i, --input <paths>',
          '-f, --file-format <format>',
          '(choices: "json", "pot")',
          '-m, --marker <name>',
          '-s, --sort',
          '-u, --unflat',
          '-d, --default-value <value>',
          '-p, --translations-path <path>',
          '-a, --add-missing-keys',
          '-e, --emit-error-on-extra-keys',
          '-h, --help',
        ],
        unexpected: ['--output', '--langs', '--replace', '--remove-extra-keys'],
      },
      {
        command: 'validate',
        expected: [
          'Usage: transloco validate [options] <files...>',
          '-h, --help',
        ],
        unexpected: ['--config'],
      },
      {
        command: 'optimize',
        expected: [
          'Usage: transloco optimize [options] [dist]',
          '-d, --dist <path>',
          '-k, --comments-key <key>',
          '(default: "comment")',
          '-h, --help',
        ],
        unexpected: ['--config'],
      },
      {
        command: 'scoped-libs',
        expected: [
          'Usage: transloco scoped-libs [options]',
          '-w, --watch',
          '--skip-gitignore',
          '-c, --config <path>',
          '-h, --help',
        ],
        unexpected: ['--dist'],
      },
    ])(
      `GIVEN the help flag on the $command command
       WHEN the program runs
       THEN it lists the options of that command alone and runs nothing`,
      async ({ command, expected, unexpected }) => {
        const { run, output } = setup();

        await expect(run(command, '--help')).rejects.toMatchObject({
          exitCode: 0,
        });

        for (const text of expected) {
          expect(unwrap(output.stdout)).toContain(text);
        }
        for (const text of unexpected) {
          expect(unwrap(output.stdout)).not.toContain(text);
        }
        expect(output.stderr).toBe('');
        expectNoRunnerCalled();
      },
    );

    it(`GIVEN the help command with a command name
        WHEN the program runs
        THEN it prints the help of that command`, async () => {
      const { run, output } = setup();

      await expect(run('help', 'find')).rejects.toMatchObject({ exitCode: 0 });

      expect(output.stdout).toContain('Usage: transloco find [options]');
    });
  });
});
