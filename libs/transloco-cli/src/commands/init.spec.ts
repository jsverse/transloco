import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';
import { generateConfigFile } from '../init/plan.js';
import { createProgram } from '../program.js';
import { collectOutput } from '../tests/program-harness.js';

import { runInit, type InitCommandOptions } from './init.js';

const ui = vi.hoisted(() => ({
  startPrompts: vi.fn(),
  askInit: vi.fn(),
  reportStep: vi.fn(),
  endPrompts: vi.fn(),
}));

vi.mock('../init/prompts.js', () => ui);

describe('runInit', () => {
  const originalCwd = process.cwd();
  const ttyDescriptors = {
    stdin: Object.getOwnPropertyDescriptor(process.stdin, 'isTTY'),
    stdout: Object.getOwnPropertyDescriptor(process.stdout, 'isTTY'),
  };
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;

  function setTerminal(isTTY: boolean) {
    for (const stream of [process.stdin, process.stdout]) {
      Object.defineProperty(stream, 'isTTY', {
        value: isTTY,
        configurable: true,
      });
    }
  }

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-')),
    );
    process.chdir(dir);
    vi.resetAllMocks();
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    setTerminal(false);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.exitCode = undefined;

    for (const [name, stream] of [
      ['stdin', process.stdin],
      ['stdout', process.stdout],
    ] as const) {
      const descriptor = ttyDescriptors[name];

      if (descriptor) {
        Object.defineProperty(stream, 'isTTY', descriptor);
      } else {
        delete (stream as { isTTY?: boolean }).isTTY;
      }
    }

    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');
  const exists = (file: string) => fs.existsSync(path.join(dir, file));
  const printed = () => log.mock.calls.map(([line]) => line);
  const options = (
    overrides: Partial<InitCommandOptions> = {},
  ): InitCommandOptions => ({ scripts: true, yes: true, ...overrides });
  const config = (rootTranslationsPath: string, langs: string[]) =>
    generateConfigFile({ rootTranslationsPath, langs, keysManager: {} });
  const packageJson = `{\n  "name": "app",\n  "scripts": {\n    "build": "tsc"\n  }\n}\n`;
  const closing = expect.stringContaining('transloco extract');

  describe('with --yes', () => {
    it(`GIVEN an empty folder
        WHEN init runs with --yes
        THEN the config and the file of the default language are written with the defaults`, async () => {
      await runInit(options());

      expect(read('transloco.config.ts')).toBe(
        config('src/assets/i18n', ['en']),
      );
      expect(read('src/assets/i18n/en.json')).toBe('{}\n');
      expect(printed()).toEqual([
        'Created transloco.config.ts',
        'Created src/assets/i18n/en.json',
        closing,
      ]);
    });

    it(`GIVEN languages and a translations path
        WHEN init runs with --yes
        THEN they are used for the config and for the files`, async () => {
      await runInit(
        options({ langs: ['en', 'es'], translationsPath: 'projects/ui/i18n/' }),
      );

      expect(read('transloco.config.ts')).toBe(
        config('projects/ui/i18n/', ['en', 'es']),
      );
      expect(read('projects/ui/i18n/en.json')).toBe('{}\n');
      expect(read('projects/ui/i18n/es.json')).toBe('{}\n');
    });

    it(`GIVEN a language given twice
        WHEN init runs with --yes
        THEN it is in the config and written once`, async () => {
      await runInit(options({ langs: ['en', 'en'] }));

      expect(read('transloco.config.ts')).toContain(`langs: [ 'en' ]`);
      expect(printed()).toHaveLength(3);
    });

    it(`GIVEN translation files that exist
        WHEN init runs with --yes
        THEN they are not touched and the missing ones are created`, async () => {
      write('src/assets/i18n/en.json', '{"a": "kept"}');

      await runInit(options({ langs: ['en', 'es'] }));

      expect(read('src/assets/i18n/en.json')).toBe('{"a": "kept"}');
      expect(read('src/assets/i18n/es.json')).toBe('{}\n');
      expect(printed()).toEqual([
        'Created transloco.config.ts',
        'Kept src/assets/i18n/en.json, it already exists',
        'Created src/assets/i18n/es.json',
        closing,
      ]);
    });

    it(`GIVEN a package.json
        WHEN init runs with --yes
        THEN the two scripts are added and the file keeps its style`, async () => {
      write('package.json', packageJson);

      await runInit(options());

      expect(read('package.json')).toBe(
        `{\n  "name": "app",\n  "scripts": {\n    "build": "tsc",\n    "i18n:extract": "transloco extract",\n    "i18n:find": "transloco find"\n  }\n}\n`,
      );
      expect(printed()).toEqual([
        'Created transloco.config.ts',
        'Created src/assets/i18n/en.json',
        'Added the script i18n:extract to package.json',
        'Added the script i18n:find to package.json',
        closing,
      ]);
    });

    it(`GIVEN a package.json that has a script of the same name
        WHEN init runs with --yes
        THEN that script is kept as it is and reported as kept`, async () => {
      write('package.json', `{"scripts": {"i18n:extract": "my-extract"}}\n`);

      await runInit(options());

      expect(JSON.parse(read('package.json')).scripts).toEqual({
        'i18n:extract': 'my-extract',
        'i18n:find': 'transloco find',
      });
      expect(printed()).toContain(
        'Kept the script i18n:extract, package.json already defines it',
      );
    });

    it(`GIVEN a package.json
        WHEN init runs with --no-scripts
        THEN the file is left byte for byte as it was`, async () => {
      write('package.json', packageJson);

      await runInit(options({ scripts: false }));

      expect(read('package.json')).toBe(packageJson);
      expect(printed().join('\n')).not.toContain('script');
    });

    it(`GIVEN a package.json that is valid JSON but no object
        WHEN init runs with --no-scripts
        THEN it is not looked at for scripts and the rest is done`, async () => {
      write('package.json', '"app"');

      await runInit(options({ scripts: false }));

      expect(read('package.json')).toBe('"app"');
      expect(exists('transloco.config.ts')).toBe(true);
    });

    it(`GIVEN no package.json
        WHEN init runs with --yes
        THEN none is created and no script is mentioned`, async () => {
      await runInit(options());

      expect(exists('package.json')).toBe(false);
      expect(printed().join('\n')).not.toContain('script');
    });

    it(`GIVEN an absolute translations path inside the folder
        WHEN init runs with --yes
        THEN the config holds it relative to the folder`, async () => {
      await runInit(options({ translationsPath: path.join(dir, 'i18n') }));

      expect(read('transloco.config.ts')).toBe(config('i18n', ['en']));
      expect(exists('i18n/en.json')).toBe(true);
    });
  });

  describe('the config that is found', () => {
    it(`GIVEN a transloco.config.ts in the folder
        WHEN init runs without --force
        THEN it is refused, telling to pass --force, and nothing is written`, async () => {
      write('transloco.config.ts', 'export default {};');

      await expect(runInit(options())).rejects.toThrow(
        'transloco.config.ts already exists. Pass --force to overwrite it.',
      );
      expect(read('transloco.config.ts')).toBe('export default {};');
      expect(exists('src')).toBe(false);
    });

    it(`GIVEN a transloco.config.ts in the folder
        WHEN init runs with --force
        THEN it is overwritten and reported as that`, async () => {
      write('transloco.config.ts', 'export default { langs: ["fr"] };');

      await runInit(options({ force: true }));

      expect(read('transloco.config.ts')).toBe(
        config('src/assets/i18n', ['en']),
      );
      expect(printed()[0]).toBe('Overwrote transloco.config.ts');
    });

    it(`GIVEN an empty transloco.config.ts
        WHEN init runs without --force
        THEN it is just as refused`, async () => {
      write('transloco.config.ts', '');

      await expect(runInit(options())).rejects.toThrow('--force');
    });

    it(`GIVEN a config that cannot be loaded, named transloco.config.ts
        WHEN init runs with --force
        THEN it is overwritten all the same`, async () => {
      write('transloco.config.ts', 'export default {');

      await expect(runInit(options())).rejects.toThrow('--force');

      await runInit(options({ force: true }));

      expect(read('transloco.config.ts')).toBe(
        config('src/assets/i18n', ['en']),
      );
    });

    it.each([
      ['transloco.config.js', 'module.exports = { langs: ["en"] };'],
      ['.translocorc.json', '{"langs": ["en"]}'],
      ['package.json', '{"name": "app", "transloco": {"langs": ["en"]}}'],
    ])(
      `GIVEN a config in %s
       WHEN init runs, with or without --force
       THEN it is refused naming the file, and nothing is written`,
      async (file, content) => {
        write(file, content);

        for (const force of [false, true]) {
          await expect(runInit(options({ force }))).rejects.toThrow(
            new RegExp(`found in ${file.replace('.', '\\.')}`),
          );
        }

        expect(read(file)).toBe(content);
        expect(exists('transloco.config.ts')).toBe(false);
        expect(exists('src')).toBe(false);
      },
    );

    it.each([
      ['transloco.config.ts'],
      ['transloco.config.js'],
      ['.translocorc.json'],
    ])(
      `GIVEN a folder inside a project with %s at its root
       WHEN init runs in the folder, with or without --force
       THEN it is refused naming the config above, and nothing is written`,
      async (file) => {
        write(
          file,
          file.endsWith('json') ? '{"langs": ["en"]}' : 'export default {};',
        );
        write('package.json', '{"name": "app"}');
        write('src/app/.gitkeep', '');
        process.chdir(path.join(dir, 'src', 'app'));

        for (const force of [false, true]) {
          await expect(runInit(options({ force }))).rejects.toThrow(
            `found in ${path.join('..', '..', file)}`,
          );
        }

        expect(fs.readdirSync(path.join(dir, 'src', 'app'))).toEqual([
          '.gitkeep',
        ]);
      },
    );

    it(`GIVEN a folder with a package.json of its own below a config
        WHEN init runs in the folder
        THEN the config above is none of its business`, async () => {
      write('transloco.config.ts', 'export default {};');
      write('libs/ui/package.json', '{"name": "ui"}');
      process.chdir(path.join(dir, 'libs', 'ui'));

      await runInit(options());

      expect(exists('libs/ui/transloco.config.ts')).toBe(true);
    });

    it(`GIVEN a config that is found
        WHEN init runs and could ask
        THEN it is refused before anything is asked`, async () => {
      setTerminal(true);
      write('transloco.config.ts', 'export default {};');

      await expect(runInit({ scripts: true })).rejects.toThrow('--force');
      expect(ui.startPrompts).not.toHaveBeenCalled();
    });
  });

  describe('what is refused', () => {
    it(`GIVEN no terminal
        WHEN init runs without --yes
        THEN it says it needs one, naming the way out, and writes nothing`, async () => {
      await expect(runInit({ scripts: true })).rejects.toThrow(
        new CliError(
          'Transloco Init: transloco init needs a terminal to ask its questions. Pass --yes to accept the defaults, together with --langs and --translations-path as needed.',
        ),
      );
      expect(fs.readdirSync(dir)).toEqual([]);
      expect(ui.askInit).not.toHaveBeenCalled();
    });

    it(`GIVEN only stdout is a terminal
        WHEN init runs without --yes
        THEN it needs one all the same`, async () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        configurable: true,
      });

      await expect(runInit({ scripts: true })).rejects.toThrow(
        'needs a terminal',
      );
    });

    it.each([
      ['not valid JSON', '{ nope', /not valid JSON/],
      ['an array', '[]', /does not hold an object/],
      ['scripts that are no object', '{"scripts": 1}', /not an object/],
    ])(
      `GIVEN a package.json that is %s
       WHEN init runs with --yes
       THEN it is refused before anything is written`,
      async (_, content, message) => {
        write('package.json', content);

        await expect(runInit(options())).rejects.toThrow(message);
        expect(fs.readdirSync(dir)).toEqual(['package.json']);
        expect(read('package.json')).toBe(content);
      },
    );

    it(`GIVEN a package.json that cannot take the scripts
        WHEN init could ask
        THEN it is refused before the first question`, async () => {
      setTerminal(true);
      write('package.json', '{ nope');

      await expect(runInit({ scripts: true })).rejects.toThrow('package.json');
      expect(ui.startPrompts).not.toHaveBeenCalled();
    });

    it.each([['../i18n'], ['..'], [path.join(os.tmpdir(), 'elsewhere')]])(
      `GIVEN the translations path %s outside the folder
       WHEN init runs with --yes
       THEN it is refused and nothing is written`,
      async (translationsPath) => {
        await expect(runInit(options({ translationsPath }))).rejects.toThrow(
          'must be inside the current directory',
        );
        expect(fs.readdirSync(dir)).toEqual([]);
      },
    );

    it(`GIVEN a link in the folder that leads outside
        WHEN init runs with a path below it
        THEN it is refused, the real path counts`, async () => {
      const outside = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-out-')),
      );

      try {
        fs.symlinkSync(outside, path.join(dir, 'link'));

        await expect(
          runInit(options({ translationsPath: 'link/i18n' })),
        ).rejects.toThrow('must be inside the current directory');
        expect(fs.readdirSync(outside)).toEqual([]);
      } finally {
        fs.rmSync(outside, { recursive: true, force: true });
      }
    });

    it(`GIVEN a comma separated list of languages
        WHEN init runs
        THEN it says they are separate arguments and how to write them`, async () => {
      await expect(runInit(options({ langs: ['en,es'] }))).rejects.toThrow(
        "The languages are separate arguments, not a comma separated list: 'en,es'. Run with --langs en es",
      );
      expect(fs.readdirSync(dir)).toEqual([]);
    });

    it.each([['../en'], ['en/es'], ['a b']])(
      `GIVEN the language %s that is no file name
       WHEN init runs
       THEN it is refused`,
      async (lang) => {
        await expect(runInit(options({ langs: [lang] }))).rejects.toThrow(
          'cannot be used as a language',
        );
        expect(fs.readdirSync(dir)).toEqual([]);
      },
    );
  });

  describe('with questions', () => {
    beforeEach(() => {
      setTerminal(true);
    });

    const answers = {
      langs: ['en', 'es'],
      translationsPath: 'i18n',
      createTranslationFiles: true,
      addScripts: true,
    };

    it(`GIVEN a terminal
        WHEN init runs without --yes
        THEN it asks, writes what was answered and reports every step`, async () => {
      write('package.json', packageJson);
      ui.askInit.mockResolvedValue(answers);

      await runInit({ scripts: true });

      expect(ui.startPrompts).toHaveBeenCalledOnce();
      expect(read('transloco.config.ts')).toBe(config('i18n', ['en', 'es']));
      expect(read('i18n/es.json')).toBe('{}\n');
      expect(JSON.parse(read('package.json')).scripts).toHaveProperty(
        'i18n:find',
      );
      expect(ui.reportStep.mock.calls.map(([step]) => step.message)).toEqual([
        'Created transloco.config.ts',
        'Created i18n/en.json',
        'Created i18n/es.json',
        'Added the script i18n:extract to package.json',
        'Added the script i18n:find to package.json',
      ]);
      expect(ui.endPrompts).toHaveBeenCalledExactlyOnceWith(closing);
      expect(log).not.toHaveBeenCalled();
      expect(process.exitCode).toBeUndefined();
    });

    it(`GIVEN a terminal and --yes
        WHEN init runs
        THEN nothing is asked`, async () => {
      await runInit(options());

      expect(ui.askInit).not.toHaveBeenCalled();
      expect(printed()).toHaveLength(3);
    });

    it(`GIVEN the options give the languages and the path
        WHEN init runs
        THEN they are handed over as given, and asked about no more`, async () => {
      ui.askInit.mockResolvedValue(answers);

      await runInit({
        scripts: true,
        langs: ['fr'],
        translationsPath: 'texts',
      });

      expect(ui.askInit.mock.calls[0][0]).toMatchObject({
        given: { langs: ['fr'], translationsPath: 'texts' },
      });
    });

    it(`GIVEN a package.json and --no-scripts, or no package.json
        WHEN init runs
        THEN the scripts are not asked about`, async () => {
      ui.askInit.mockResolvedValue({ ...answers, addScripts: false });

      await runInit({ scripts: true });
      write('package.json', packageJson);
      await runInit({ scripts: false, force: true });
      await runInit({ scripts: true, force: true });

      expect(
        ui.askInit.mock.calls.map(([{ askScripts }]) => askScripts),
      ).toEqual([false, false, true]);
    });

    it(`GIVEN files that are there
        WHEN the questions look for the missing ones
        THEN only those that are not on disk are named`, async () => {
      write('i18n/en.json', '{}');
      ui.askInit.mockImplementation(async ({ findMissing }) => {
        expect(findMissing(['en', 'es'], 'i18n/')).toEqual(['i18n/es.json']);

        return answers;
      });

      await runInit({ scripts: true });

      expect(ui.askInit).toHaveBeenCalledOnce();
    });

    it(`GIVEN a question is cancelled
        WHEN init runs
        THEN nothing is written, nothing is reported and the exit code is 130`, async () => {
      write('package.json', packageJson);
      ui.askInit.mockResolvedValue(undefined);

      await runInit({ scripts: true });

      expect(fs.readdirSync(dir)).toEqual(['package.json']);
      expect(read('package.json')).toBe(packageJson);
      expect(ui.reportStep).not.toHaveBeenCalled();
      expect(ui.endPrompts).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(130);
    });

    it(`GIVEN an absolute path was answered
        WHEN init runs
        THEN the config holds it relative to the folder`, async () => {
      ui.askInit.mockResolvedValue({
        ...answers,
        translationsPath: path.join(dir, 'i18n'),
      });

      await runInit({ scripts: true });

      expect(read('transloco.config.ts')).toBe(config('i18n', ['en', 'es']));
    });
  });

  describe('the program', () => {
    async function run(...args: string[]) {
      const program = createProgram();
      const output = collectOutput(program);

      await program.parseAsync(args, { from: 'user' });

      return output;
    }

    it(`GIVEN the init command
        WHEN it runs with --yes and options
        THEN the options reach the runner`, async () => {
      write('package.json', packageJson);

      const output = await run(
        'init',
        '--yes',
        '--langs',
        'en',
        'es',
        '--translations-path',
        'texts',
        '--no-scripts',
      );

      expect(output.stderr).toBe('');
      expect(read('transloco.config.ts')).toBe(config('texts', ['en', 'es']));
      expect(read('texts/es.json')).toBe('{}\n');
      expect(read('package.json')).toBe(packageJson);
    });

    it(`GIVEN the short options
        WHEN init runs
        THEN they are the same as the long ones`, async () => {
      await run('init', '-y', '-l', 'de');

      expect(read('transloco.config.ts')).toBe(
        config('src/assets/i18n', ['de']),
      );
    });

    it(`GIVEN --cwd
        WHEN init runs
        THEN everything is written in that folder`, async () => {
      fs.mkdirSync(path.join(dir, 'app'));

      await run('--cwd', 'app', 'init', '--yes');

      expect(exists('app/transloco.config.ts')).toBe(true);
      expect(exists('app/src/assets/i18n/en.json')).toBe(true);
      expect(exists('transloco.config.ts')).toBe(false);
    });

    it(`GIVEN an existing config
        WHEN init runs with --force through the program
        THEN it is overwritten`, async () => {
      write('transloco.config.ts', 'export default {};');

      await run('init', '--yes', '--force');

      expect(read('transloco.config.ts')).toContain('keysManager');
    });

    it(`GIVEN no terminal
        WHEN init runs through the program without --yes
        THEN the error comes out of the parse`, async () => {
      await expect(run('init')).rejects.toThrow('needs a terminal');
    });
  });
});
