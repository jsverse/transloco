import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetScopes } from './keys-manager/keys-builder/utils/scope.utils.js';
import type { Config } from './keys-manager/types.js';
import { resolveConfig } from './keys-manager/utils/resolve-config.js';
import { createProgram } from './program.js';
import { collectOutput } from './tests/program-harness.js';

/**
 * The runners are the real ones here, only the two entry points of the keys
 * manager are replaced, to capture the inline config the program hands over.
 */
const keysManager = vi.hoisted(() => ({
  buildTranslationFiles: vi.fn(),
  findMissingKeys: vi.fn(),
}));

vi.mock('./keys-manager/keys-builder/index.js', () => ({
  buildTranslationFiles: keysManager.buildTranslationFiles,
}));
vi.mock('./keys-manager/keys-detective/index.js', () => ({
  findMissingKeys: keysManager.findMissingKeys,
}));

/** The options both commands read. */
const common = {
  input: 'src/app',
  sort: true,
  defaultValue: 'TODO: {{key}}',
};
const extractOnly = { output: 'locale', replace: true, removeExtraKeys: true };
const findOnly = { addMissingKeys: true, emitErrorOnExtraKeys: true };

const configs = {
  /** One file for both commands, holding every option either of them reads. */
  shared: {
    rootTranslationsPath: 'src/assets/i18n',
    langs: ['en', 'es'],
    keysManager: { ...common, ...extractOnly, ...findOnly },
  },
  /** The same file without what only the other command reads. */
  extract: {
    langs: ['en', 'es'],
    keysManager: { ...common, ...extractOnly },
  },
  find: {
    rootTranslationsPath: 'src/assets/i18n',
    keysManager: { ...common, ...findOnly },
  },
};

/**
 * The options only the other command reads, in both of their spellings. Not a
 * word about any of them may be printed, on any channel.
 */
const otherCommandOptions = {
  extract: [
    'addMissingKeys',
    'add-missing-keys',
    'emitErrorOnExtraKeys',
    'emit-error-on-extra-keys',
    'translationsPath',
    'translations-path',
    'rootTranslationsPath',
  ],
  find: ['output', 'replace', 'removeExtraKeys', 'remove-extra-keys', 'langs'],
};

type CommandName = 'extract' | 'find';

describe('options of the other command in the config file', () => {
  const originalCwd = process.cwd();
  let dir: string;
  /** Everything printed, whichever way: the console methods and both streams. */
  let printers: Record<string, ReturnType<typeof vi.spyOn>>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-provenance-')),
    );

    // One project per config. They are separate directories, as a config file
    // is only ever loaded once per path.
    for (const [name, config] of Object.entries(configs)) {
      for (const directory of ['src/app', 'src/assets/i18n', 'typed/i18n']) {
        fs.mkdirSync(path.join(dir, name, directory), { recursive: true });
      }
      fs.writeFileSync(
        path.join(dir, name, 'transloco.config.js'),
        `module.exports = ${JSON.stringify(config)};`,
      );
    }

    printers = {
      'console.log': vi.spyOn(console, 'log').mockImplementation(() => {}),
      'console.info': vi.spyOn(console, 'info').mockImplementation(() => {}),
      'console.warn': vi.spyOn(console, 'warn').mockImplementation(() => {}),
      'console.error': vi.spyOn(console, 'error').mockImplementation(() => {}),
      'process.stdout.write': vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true),
      'process.stderr.write': vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true),
    };
    exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    resetScopes();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  /** What was printed through each channel since the last run started, as text. */
  function printed(project: string) {
    return Object.entries(printers).flatMap(([channel, printer]) =>
      printer.mock.calls.map(
        (call: unknown[]) =>
          `${channel}: ${call.map(String).join(' ').split(project).join('<project>')}`,
      ),
    );
  }

  /**
   * Runs the command in the project holding the given config, up to and
   * including the keys manager resolving its config, which is where the file
   * is read and merged with what was typed.
   */
  async function run(
    command: CommandName,
    config: keyof typeof configs,
    ...typed: string[]
  ) {
    const project = path.join(dir, config);
    const entry =
      command === 'extract'
        ? keysManager.buildTranslationFiles
        : keysManager.findMissingKeys;

    process.chdir(project);
    vi.clearAllMocks();
    resetScopes();

    await createProgram().parseAsync(
      [command, '--config', 'transloco.config.js', ...typed],
      { from: 'user' },
    );

    expect(entry).toHaveBeenCalledOnce();

    const inline: Config = entry.mock.calls[0][0];
    const resolved = resolveConfig(inline);

    return {
      project,
      inline,
      resolved,
      printed: printed(project),
      exited: exit.mock.calls.length > 0,
    };
  }

  function expectNoWordAboutTheOtherCommand(
    command: CommandName,
    output: string[],
  ) {
    expect(printers['console.warn']).not.toHaveBeenCalled();
    expect(printers['console.error']).not.toHaveBeenCalled();
    expect(
      output.filter((text) =>
        otherCommandOptions[command].some((option) => text.includes(option)),
      ),
    ).toEqual([]);
  }

  it(`GIVEN a config file that also sets the options only find reads
      WHEN extract runs with that file and a single typed flag
      THEN the keys manager gets the typed flags alone, and resolving them applies the whole file`, async () => {
    const { project, inline, resolved, exited, printed } = await run(
      'extract',
      'shared',
      '--output',
      'typed',
    );

    expect(inline).toEqual({
      command: 'extract',
      config: 'transloco.config.js',
      output: 'typed',
    });
    expect(keysManager.findMissingKeys).not.toHaveBeenCalled();
    expect(resolved).toMatchObject({
      command: 'extract',
      // typed on the command line, so it wins over the file
      output: path.join(project, 'typed'),
      // from the file, read by extract
      input: [path.join(project, 'src/app')],
      langs: ['en', 'es'],
      sort: true,
      defaultValue: 'TODO: {{key}}',
      replace: true,
      removeExtraKeys: true,
      // from the file, read by find alone: carried along, never an error
      translationsPath: path.join(project, 'src/assets/i18n'),
      addMissingKeys: true,
      emitErrorOnExtraKeys: true,
    });
    expect(exited).toBe(false);
    expectNoWordAboutTheOtherCommand('extract', printed);
  });

  it(`GIVEN the same config file, which also sets the options only extract reads
      WHEN find runs with that file and a single typed flag
      THEN the keys manager gets the typed flags alone, and resolving them applies the whole file`, async () => {
    const { project, inline, resolved, exited, printed } = await run(
      'find',
      'shared',
      '--translations-path',
      'typed/i18n',
    );

    expect(inline).toEqual({
      command: 'find',
      config: 'transloco.config.js',
      translationsPath: 'typed/i18n',
    });
    expect(keysManager.buildTranslationFiles).not.toHaveBeenCalled();
    expect(resolved).toMatchObject({
      command: 'find',
      // typed on the command line, so it wins over the file
      translationsPath: path.join(project, 'typed/i18n'),
      // from the file, read by find
      input: [path.join(project, 'src/app')],
      sort: true,
      defaultValue: 'TODO: {{key}}',
      addMissingKeys: true,
      emitErrorOnExtraKeys: true,
      // from the file, read by extract alone: carried along, never an error
      langs: ['en', 'es'],
      output: path.join(project, 'locale'),
      replace: true,
      removeExtraKeys: true,
    });
    expect(exited).toBe(false);
    expectNoWordAboutTheOtherCommand('find', printed);
  });

  it.each([
    ['extract', ['--output', 'typed']],
    ['find', ['--translations-path', 'typed/i18n']],
    ['extract', []],
    ['find', []],
  ] as const)(
    `GIVEN one config file with the options of both commands and one with those of %s alone
     WHEN the command runs with each of them and the typed flags %j
     THEN both runs print exactly the same, through every channel, and neither exits`,
    async (command, typed) => {
      const own = await run(command, command, ...typed);
      const shared = await run(command, 'shared', ...typed);

      // Whatever its wording, a remark about the options of the other command
      // would only be made when the file holds some.
      expect(shared.printed).toEqual(own.printed);
      expect(shared.exited).toBe(false);
      expect(own.exited).toBe(false);
      expectNoWordAboutTheOtherCommand(command, shared.printed);
    },
  );

  it(`GIVEN the same config file
      WHEN extract is given a flag only find reads on the command line
      THEN it is rejected, as only the file is free to hold it`, async () => {
    process.chdir(path.join(dir, 'shared'));

    const program = createProgram();
    const output = collectOutput(program);

    await expect(
      program.parseAsync(
        ['extract', '--config', 'transloco.config.js', '--add-missing-keys'],
        { from: 'user' },
      ),
    ).rejects.toMatchObject({ exitCode: 1 });

    expect(output.stderr).toContain(
      `error: unknown option '--add-missing-keys'`,
    );
    expect(keysManager.buildTranslationFiles).not.toHaveBeenCalled();
  });
});
