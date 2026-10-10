import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';
import { generateConfigFile } from '../init/plan.js';
import { resolveConfig } from '../keys-manager/utils/resolve-config.js';
import { createProgram } from '../program.js';
import { refuseToOpenWhatIsNoFile } from '../tests/fifo-guard.js';
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
  // Nothing stops a user that can write anywhere
  const asRoot = process.getuid?.() === 0;
  const locked: string[] = [];
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

    // A folder that can't be written can't be removed either
    for (const target of locked.splice(0)) {
      fs.chmodSync(target, fs.statSync(target).isDirectory() ? 0o755 : 0o644);
    }

    fs.rmSync(dir, { recursive: true, force: true });
  });

  /** Takes the right to write away, which `afterEach` gives back. */
  function lock(file: string) {
    const target = path.join(dir, file);

    locked.push(target);
    fs.chmodSync(target, fs.statSync(target).isDirectory() ? 0o555 : 0o444);
  }

  /** Everything below the folder: the content of a file, `null` for a folder, the target of a link. */
  function tree() {
    return Object.fromEntries(
      fs.readdirSync(dir, { recursive: true }).map((entry) => {
        const file = path.join(dir, entry);
        const stats = fs.lstatSync(file);

        return [
          entry,
          stats.isSymbolicLink()
            ? `-> ${fs.readlinkSync(file)}`
            : stats.isDirectory()
              ? null
              : fs.readFileSync(file, 'utf-8'),
        ];
      }),
    );
  }

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

    it.each([[['en', 'es,fr']], [['en,es', 'fr']]])(
      `GIVEN the languages %j, one of them with a comma
       WHEN init runs
       THEN it is refused, wherever the comma stands`,
      async (langs) => {
        await expect(runInit(options({ langs }))).rejects.toThrow(
          'The languages are separate arguments, not a comma separated list',
        );
        expect(fs.readdirSync(dir)).toEqual([]);
      },
    );

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

  describe('what is checked before the first file is written', () => {
    const inTheWay =
      'Transloco Init: The translations path src/assets/i18n is, or lies inside, a file';

    it.each([['src'], ['src/assets'], ['src/assets/i18n']])(
      `GIVEN the file %s on the way to the default translations path
       WHEN init runs with --yes
       THEN it is refused with one line and nothing is written`,
      async (file) => {
        write(file, '');
        const before = tree();

        await expect(runInit(options())).rejects.toThrow(
          new CliError(inTheWay),
        );
        expect(tree()).toEqual(before);
        expect(log).not.toHaveBeenCalled();
      },
    );

    it(`GIVEN a file on the way to the translations path that was answered
        WHEN init runs and asks
        THEN it is refused after the answers, and nothing is written or reported`, async () => {
      setTerminal(true);
      write('texts', '');
      ui.askInit.mockResolvedValue({
        langs: ['en'],
        translationsPath: 'texts/i18n',
        createTranslationFiles: true,
        addScripts: false,
      });
      const before = tree();

      await expect(runInit({ scripts: true })).rejects.toThrow(
        new CliError(
          'Transloco Init: The translations path texts/i18n is, or lies inside, a file',
        ),
      );
      expect(tree()).toEqual(before);
      expect(ui.reportStep).not.toHaveBeenCalled();
    });

    it(`GIVEN a file on the way to the default translations path and another folder given
        WHEN init runs with --yes
        THEN the default is none of its business`, async () => {
      write('src', '');

      await runInit(options({ translationsPath: 'texts' }));

      expect(exists('texts/en.json')).toBe(true);
    });

    it.skipIf(asRoot)(
      `GIVEN the folder src/assets/i18n is read-only
       WHEN init runs with --yes
       THEN it is refused naming the file and the folder, and nothing is written`,
      async () => {
        fs.mkdirSync(path.join(dir, 'src/assets/i18n'), { recursive: true });
        lock('src/assets/i18n');
        const before = tree();

        await expect(runInit(options())).rejects.toThrow(
          new CliError(
            `Transloco Init: cannot write src/assets/i18n/en.json, the folder ${path.join('src', 'assets', 'i18n')} is read-only. Nothing was written.`,
          ),
        );
        expect(tree()).toEqual(before);
        expect(exists('transloco.config.ts')).toBe(false);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN the folder src is read-only
       WHEN init runs with --yes
       THEN it is refused naming the file and the folder, and nothing is written`,
      async () => {
        fs.mkdirSync(path.join(dir, 'src'));
        lock('src');
        const before = tree();

        await expect(runInit(options())).rejects.toThrow(
          new CliError(
            'Transloco Init: cannot write src/assets/i18n/en.json, the folder src is read-only. Nothing was written.',
          ),
        );
        expect(tree()).toEqual(before);
        expect(exists('transloco.config.ts')).toBe(false);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN the working directory is read-only
       WHEN init runs with --yes
       THEN it is refused naming the config`,
      async () => {
        lock('.');

        await expect(runInit(options())).rejects.toThrow(
          new CliError(
            'Transloco Init: cannot write transloco.config.ts, the folder . is read-only. Nothing was written.',
          ),
        );
        expect(fs.readdirSync(dir)).toEqual([]);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN a package.json that is read-only
       WHEN init runs with --yes
       THEN it is refused before the config and the translation file are written`,
      async () => {
        write('package.json', packageJson);
        lock('package.json');
        const before = tree();

        await expect(runInit(options())).rejects.toThrow(
          new CliError(
            'Transloco Init: cannot write package.json, it is read-only. Nothing was written.',
          ),
        );
        expect(tree()).toEqual(before);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN a package.json that is read-only
       WHEN init runs with --no-scripts
       THEN it is not written to, and the rest is done`,
      async () => {
        write('package.json', packageJson);
        lock('package.json');

        await runInit(options({ scripts: false }));

        expect(read('package.json')).toBe(packageJson);
        expect(exists('transloco.config.ts')).toBe(true);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN a transloco.config.ts that is read-only
       WHEN init runs with --force
       THEN it is refused and nothing is written`,
      async () => {
        write('transloco.config.ts', 'export default {};');
        lock('transloco.config.ts');
        const before = tree();

        await expect(runInit(options({ force: true }))).rejects.toThrow(
          new CliError(
            'Transloco Init: cannot write transloco.config.ts, it is read-only. Nothing was written.',
          ),
        );
        expect(tree()).toEqual(before);
      },
    );

    it.skipIf(asRoot)(
      `GIVEN a folder that is read-only
       WHEN init runs and asks
       THEN it is refused after the answers, before anything is written or reported`,
      async () => {
        setTerminal(true);
        fs.mkdirSync(path.join(dir, 'texts'));
        lock('texts');
        ui.askInit.mockResolvedValue({
          langs: ['en'],
          translationsPath: 'texts',
          createTranslationFiles: true,
          addScripts: false,
        });

        await expect(runInit({ scripts: true })).rejects.toThrow(
          'Transloco Init: cannot write texts/en.json, the folder texts is read-only. Nothing was written.',
        );
        expect(exists('transloco.config.ts')).toBe(false);
        expect(ui.reportStep).not.toHaveBeenCalled();
      },
    );

    it.skipIf(asRoot)(
      `GIVEN translation files that exist in a read-only folder
       WHEN init runs with --yes
       THEN nothing is written there, so nothing is refused`,
      async () => {
        write('src/assets/i18n/en.json', '{}');
        lock('src/assets/i18n');

        await runInit(options());

        expect(exists('transloco.config.ts')).toBe(true);
      },
    );
  });

  describe('a file system problem that the check could not see', () => {
    // Fails the first write only, so that what undoes it is not stopped by it
    const fail = (match: string) => {
      const writeFile = fs.writeFileSync;
      let failed = false;

      vi.spyOn(fs, 'writeFileSync').mockImplementation(((
        file: fs.PathOrFileDescriptor,
        ...rest: [string]
      ) => {
        if (String(file).endsWith(match) && !failed) {
          failed = true;

          throw new Error('EIO: boom');
        }

        return writeFile(file, ...rest);
      }) as typeof fs.writeFileSync);
    };

    /** Lets the write of the file through and fails it all the same, as a disk that runs full does. */
    const failAfterWriting = (match: string) => {
      const writeFile = fs.writeFileSync;
      let failed = false;

      vi.spyOn(fs, 'writeFileSync').mockImplementation(((
        file: fs.PathOrFileDescriptor,
        ...rest: [string]
      ) => {
        writeFile(file, ...rest);

        if (String(file).endsWith(match) && !failed) {
          failed = true;

          throw new Error('ENOSPC: full');
        }
      }) as typeof fs.writeFileSync);
    };

    it(`GIVEN a translation file that fails to be written after the config
        WHEN init runs with --yes
        THEN the error names the file, and the config and the folders are gone again`, async () => {
      const before = tree();

      fail('en.json');

      await expect(runInit(options())).rejects.toThrow(
        new CliError(
          'Transloco Init: could not write src/assets/i18n/en.json: EIO: boom. Nothing was changed.',
        ),
      );
      expect(tree()).toEqual(before);
      expect(printed()).toEqual([]);
    });

    it(`GIVEN a translations path with a folder that was there
        WHEN a file fails to be written
        THEN the folders init made are removed and the one that was there stays`, async () => {
      write('src/keep.txt', 'mine');
      const before = tree();

      fail('de.json');

      await expect(runInit(options({ langs: ['en', 'de'] }))).rejects.toThrow(
        'Nothing was changed.',
      );
      expect(tree()).toEqual(before);
    });

    it(`GIVEN a folder that init made and that something else has put a file in
        WHEN a file fails to be written
        THEN the folder and the file in it stay, and the error says so`, async () => {
      const writeFile = fs.writeFileSync;

      vi.spyOn(fs, 'writeFileSync').mockImplementation(((
        file: fs.PathOrFileDescriptor,
        ...rest: [string]
      ) => {
        if (String(file).endsWith('de.json')) {
          writeFile(path.join(dir, 'src', 'assets', 'i18n', 'other.txt'), 'x');

          throw new Error('EIO: boom');
        }

        return writeFile(file, ...rest);
      }) as typeof fs.writeFileSync);

      await expect(runInit(options({ langs: ['en', 'de'] }))).rejects.toThrow(
        new CliError(
          'Transloco Init: could not write src/assets/i18n/de.json: EIO: boom. Undoing it failed, these were left behind: src/assets/i18n (folder not removed), src/assets (folder not removed), src (folder not removed).',
        ),
      );
      expect(exists('src/assets/i18n/other.txt')).toBe(true);
      expect(exists('transloco.config.ts')).toBe(false);
      expect(exists('src/assets/i18n/en.json')).toBe(false);
    });

    it(`GIVEN the config fails to be written
        WHEN init runs with --yes
        THEN the error names it and says nothing was changed`, async () => {
      fail('transloco.config.ts');

      await expect(runInit(options())).rejects.toThrow(
        new CliError(
          'Transloco Init: could not write transloco.config.ts: EIO: boom. Nothing was changed.',
        ),
      );
      expect(tree()).toEqual({});
    });

    it(`GIVEN the package.json fails to be written
        WHEN init runs and asks
        THEN everything written before it is undone, and nothing was reported`, async () => {
      setTerminal(true);
      write('package.json', packageJson);
      const before = tree();

      ui.askInit.mockResolvedValue({
        langs: ['en'],
        translationsPath: 'i18n',
        createTranslationFiles: true,
        addScripts: true,
      });
      fail('package.json');

      await expect(runInit({ scripts: true })).rejects.toThrow(
        'Transloco Init: could not write package.json: EIO: boom. Nothing was changed.',
      );
      expect(tree()).toEqual(before);
      expect(ui.reportStep).not.toHaveBeenCalled();
    });

    it(`GIVEN an existing config and a package.json
        WHEN init runs with --force and the package.json is written only partly
        THEN both are back as they were and nothing else is left`, async () => {
      write('transloco.config.ts', 'export default { langs: ["fr"] };');
      write('package.json', packageJson);
      const before = tree();

      failAfterWriting('package.json');

      await expect(runInit(options({ force: true }))).rejects.toThrow(
        'Transloco Init: could not write package.json: ENOSPC: full. Nothing was changed.',
      );
      expect(tree()).toEqual(before);
    });

    it(`GIVEN a language name that the file system refuses
        WHEN init runs with --yes
        THEN it fails while writing, and the folder is as it was`, async () => {
      write('package.json', packageJson);
      const before = tree();

      await expect(
        runInit(options({ langs: ['a'.repeat(300)] })),
      ).rejects.toThrow(
        /^Transloco Init: could not write .+\. Nothing was changed\.$/,
      );
      expect(tree()).toEqual(before);
    });

    it(`GIVEN the config that was written fails to be removed again
        WHEN a later file fails to be written
        THEN the error says which paths were left behind`, async () => {
      fail('en.json');
      const remove = fs.rmSync;

      vi.spyOn(fs, 'rmSync').mockImplementation(((
        file: fs.PathLike,
        ...rest: [fs.RmOptions]
      ) => {
        if (String(file).endsWith('transloco.config.ts')) {
          throw new Error('EBUSY: busy');
        }

        return remove(file, ...rest);
      }) as typeof fs.rmSync);

      await expect(runInit(options())).rejects.toThrow(
        new CliError(
          'Transloco Init: could not write src/assets/i18n/en.json: EIO: boom. Undoing it failed, these were left behind: transloco.config.ts (not removed).',
        ),
      );
      expect(exists('transloco.config.ts')).toBe(true);
      expect(exists('src')).toBe(false);
    });

    it(`GIVEN an overwritten config that fails to be put back
        WHEN a later file fails to be written
        THEN the error names it`, async () => {
      write('transloco.config.ts', 'export default { langs: ["fr"] };');
      const writeFile = fs.writeFileSync;
      let configWrites = 0;

      vi.spyOn(fs, 'writeFileSync').mockImplementation(((
        file: fs.PathOrFileDescriptor,
        ...rest: [string]
      ) => {
        if (String(file).endsWith('en.json')) throw new Error('EIO: boom');

        if (
          String(file).endsWith('transloco.config.ts') &&
          ++configWrites > 1
        ) {
          throw new Error('EIO: again');
        }

        return writeFile(file, ...rest);
      }) as typeof fs.writeFileSync);

      await expect(runInit(options({ force: true }))).rejects.toThrow(
        new CliError(
          'Transloco Init: could not write src/assets/i18n/en.json: EIO: boom. Undoing it failed, these were left behind: transloco.config.ts (could not be restored).',
        ),
      );
    });
  });

  describe('a file that cannot be read while looking for a config', () => {
    const unreadable = (file: string) =>
      new RegExp(
        `^Transloco Init: could not read ${file.replaceAll('.', '\\.')} while looking for an existing Transloco config: .+$`,
      );
    const withBom = '﻿{\n  "name": "app",\n  "version": "1.0.0"\n}\n';

    it.each([[true], [false]])(
      `GIVEN a package.json that starts with a BOM
       WHEN init runs with --yes (scripts: %j)
       THEN it is refused with one line naming the file, and nothing is written`,
      async (scripts) => {
        write('package.json', withBom);
        const before = tree();

        await expect(runInit(options({ scripts }))).rejects.toThrow(
          unreadable('package.json'),
        );
        expect(tree()).toEqual(before);
      },
    );

    it(`GIVEN a package.json that is no valid JSON
        WHEN init runs with --no-scripts
        THEN it is refused with one line naming the file, and nothing is written`, async () => {
      write('package.json', '{\n  "name": \n}\n');

      await expect(runInit(options({ scripts: false }))).rejects.toThrow(
        unreadable('package.json'),
      );
      expect(fs.readdirSync(dir)).toEqual(['package.json']);
    });

    it(`GIVEN a config of another name that throws when it is loaded
        WHEN init runs with --yes
        THEN it is refused with one line naming that file`, async () => {
      write('transloco.config.js', 'module.exports = {');

      await expect(runInit(options())).rejects.toThrow(
        unreadable('transloco.config.js'),
      );
      expect(fs.readdirSync(dir)).toEqual(['transloco.config.js']);
    });

    it(`GIVEN a config in a folder above that throws when it is loaded
        WHEN init runs with --yes
        THEN the file is named relative to the working directory`, async () => {
      write('package.json', '{"name": "app"}');
      write('.translocorc.json', '{\n  "langs": \n}');
      write('src/app/.gitkeep', '');
      process.chdir(path.join(dir, 'src', 'app'));

      await expect(runInit(options())).rejects.toThrow(
        unreadable(path.join('..', '..', '.translocorc.json')),
      );
    });

    it(`GIVEN a transloco.config.ts and a package.json starting with a BOM
        WHEN init runs with --force
        THEN the package.json is the file that is named, the config is not to blame`, async () => {
      write('transloco.config.ts', 'export default {};');
      write('package.json', withBom);

      await expect(runInit(options({ force: true }))).rejects.toThrow(
        unreadable('package.json'),
      );
      expect(read('transloco.config.ts')).toBe('export default {};');
    });

    it(`GIVEN a package.json starting with a BOM
        WHEN init could ask
        THEN it is refused before the first question`, async () => {
      setTerminal(true);
      write('package.json', withBom);

      await expect(runInit({ scripts: true })).rejects.toThrow(
        unreadable('package.json'),
      );
      expect(ui.startPrompts).not.toHaveBeenCalled();
    });
  });

  describe('a package.json that is a link', () => {
    let outside: string;

    beforeEach(() => {
      outside = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-out-')),
      );
    });

    afterEach(() => {
      fs.rmSync(outside, { recursive: true, force: true });
    });

    const linkToOutside = () => {
      fs.writeFileSync(path.join(outside, 'package.json'), packageJson);
      fs.symlinkSync(
        path.join(outside, 'package.json'),
        path.join(dir, 'package.json'),
      );
    };

    it(`GIVEN a link to a package.json inside the folder
        WHEN init runs with --yes
        THEN the scripts go into the file it leads to and the link stays`, async () => {
      write('shared/package.json', packageJson);
      fs.symlinkSync(
        path.join('shared', 'package.json'),
        path.join(dir, 'package.json'),
      );

      await runInit(options());

      expect(
        fs.lstatSync(path.join(dir, 'package.json')).isSymbolicLink(),
      ).toBe(true);
      expect(fs.readlinkSync(path.join(dir, 'package.json'))).toBe(
        path.join('shared', 'package.json'),
      );
      expect(JSON.parse(read('shared/package.json')).scripts).toEqual({
        build: 'tsc',
        'i18n:extract': 'transloco extract',
        'i18n:find': 'transloco find',
      });
      expect(printed()).toContain(
        'Added the script i18n:extract to package.json',
      );
    });

    it(`GIVEN a link to a package.json outside the folder
        WHEN init runs with --yes
        THEN the file is left alone and a line says why`, async () => {
      linkToOutside();

      await runInit(options());

      expect(fs.readFileSync(path.join(outside, 'package.json'), 'utf-8')).toBe(
        packageJson,
      );
      expect(printed()).toEqual([
        'Created transloco.config.ts',
        'Created src/assets/i18n/en.json',
        'Left package.json alone, it is a link that leads outside the folder',
        closing,
      ]);
    });

    it(`GIVEN a link to a package.json outside the folder
        WHEN init runs with --no-scripts
        THEN nothing is said about it`, async () => {
      linkToOutside();

      await runInit(options({ scripts: false }));

      expect(printed().join('\n')).not.toContain('package.json');
    });

    it(`GIVEN a link to a package.json outside the folder
        WHEN init runs and asks
        THEN the scripts are not asked about, and the line is reported as a step`, async () => {
      setTerminal(true);
      linkToOutside();
      ui.askInit.mockResolvedValue({
        langs: ['en'],
        translationsPath: 'i18n',
        createTranslationFiles: true,
        addScripts: false,
      });

      await runInit({ scripts: true });

      expect(ui.askInit.mock.calls[0][0]).toMatchObject({ askScripts: false });
      expect(ui.reportStep.mock.calls.map(([step]) => step.message)).toContain(
        'Left package.json alone, it is a link that leads outside the folder',
      );
    });

    it(`GIVEN a link to nowhere
        WHEN init runs with --yes
        THEN the file is left alone and a line says why`, async () => {
      fs.symlinkSync(
        path.join(outside, 'missing.json'),
        path.join(dir, 'package.json'),
      );

      await runInit(options());

      expect(printed()).toContain(
        'Left package.json alone, it is a link that leads nowhere',
      );
      expect(exists('transloco.config.ts')).toBe(true);
    });
  });

  describe('a package.json that cannot be read', () => {
    it.skipIf(asRoot || process.platform === 'win32').each([[true], [false]])(
      `GIVEN a package.json without the right to read it
       WHEN init runs with --yes (scripts: %j)
       THEN it is refused with one line naming the file, and nothing is written`,
      async (scripts) => {
        write('package.json', packageJson);

        const target = path.join(dir, 'package.json');

        locked.push(target);
        fs.chmodSync(target, 0o000);

        await expect(runInit(options({ scripts }))).rejects.toThrow(
          new CliError(
            'Transloco Init: could not read package.json: EACCES: permission denied',
          ),
        );
        expect(fs.readdirSync(dir)).toEqual(['package.json']);
      },
    );
  });

  describe('a transloco.config.ts that is a link', () => {
    let outside: string;

    beforeEach(() => {
      outside = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-out-')),
      );
    });

    afterEach(() => {
      fs.rmSync(outside, { recursive: true, force: true });
    });

    it(`GIVEN a link to a config inside the folder
        WHEN init runs with --force
        THEN the file it leads to is overwritten and the link stays`, async () => {
      write('shared/config.ts', 'export default { langs: ["fr"] };');
      fs.symlinkSync(
        path.join('shared', 'config.ts'),
        path.join(dir, 'transloco.config.ts'),
      );

      await runInit(options({ force: true }));

      expect(fs.readlinkSync(path.join(dir, 'transloco.config.ts'))).toBe(
        path.join('shared', 'config.ts'),
      );
      expect(read('shared/config.ts')).toBe(config('src/assets/i18n', ['en']));
    });

    it.each([[false], [true]])(
      `GIVEN a link to a config outside the folder
       WHEN init runs (force: %j)
       THEN it is refused, and the file it leads to and the folder are as they were`,
      async (force) => {
        const target = path.join(outside, 'config.ts');

        fs.writeFileSync(target, 'export default { langs: ["fr"] };');
        fs.symlinkSync(target, path.join(dir, 'transloco.config.ts'));

        const before = tree();

        await expect(runInit(options({ force }))).rejects.toThrow(
          new CliError(
            'Transloco Init: transloco.config.ts is a link that leads outside the folder, and writing it would overwrite the file it leads to. Nothing was written.',
          ),
        );
        expect(fs.readFileSync(target, 'utf-8')).toBe(
          'export default { langs: ["fr"] };',
        );
        expect(tree()).toEqual(before);
      },
    );
  });

  describe('what is neither a file nor a folder', () => {
    // A test that would hang fails instead, as the guard throws
    beforeEach(refuseToOpenWhatIsNoFile);

    const makeFifo = (file: string) => {
      const target = path.join(dir, file);

      fs.mkdirSync(path.dirname(target), { recursive: true });
      execFileSync('mkfifo', [target]);

      return target;
    };

    it
      .skipIf(process.platform === 'win32')
      .each([['package.json'], ['transloco.config.ts']])(
      `GIVEN a FIFO named %s
       WHEN init runs with --yes
       THEN it is refused before the config is looked for, and nothing is written`,
      async (name) => {
        makeFifo(name);

        await expect(runInit(options({ scripts: false }))).rejects.toThrow(
          new CliError(
            `Transloco Init: cannot use ${name}, it is a FIFO. Nothing was written.`,
          ),
        );
        expect(fs.readdirSync(dir)).toEqual([name]);
      },
      5000,
    );

    it.skipIf(process.platform === 'win32')(
      `GIVEN a package.json that is a link to a FIFO
       WHEN init runs with --yes
       THEN it is refused, and says it is a link`,
      async () => {
        const fifo = makeFifo('queue');

        fs.symlinkSync(fifo, path.join(dir, 'package.json'));

        await expect(runInit(options())).rejects.toThrow(
          'Transloco Init: cannot use package.json, it is a link to a FIFO. Nothing was written.',
        );
      },
      5000,
    );

    it.skipIf(process.platform === 'win32')(
      `GIVEN a FIFO where a translation file goes
       WHEN init runs with --yes
       THEN it is refused instead of being kept, and nothing is written`,
      async () => {
        makeFifo('src/assets/i18n/en.json');

        await expect(runInit(options())).rejects.toThrow(
          'Transloco Init: cannot use src/assets/i18n/en.json, it is a FIFO. Nothing was written.',
        );
        expect(exists('transloco.config.ts')).toBe(false);
      },
      5000,
    );

    it.skipIf(process.platform === 'win32')(
      `GIVEN a FIFO where a translation file goes
       WHEN init asks and the answers lead to it
       THEN it is refused before anything is written`,
      async () => {
        setTerminal(true);
        makeFifo('i18n/en.json');
        ui.askInit.mockResolvedValue({
          langs: ['en'],
          translationsPath: 'i18n',
          createTranslationFiles: true,
          addScripts: false,
        });

        await expect(runInit({ scripts: true })).rejects.toThrow(
          'Transloco Init: cannot use i18n/en.json, it is a FIFO. Nothing was written.',
        );
        expect(exists('transloco.config.ts')).toBe(false);
      },
      5000,
    );

    it.skipIf(process.platform === 'win32')(
      `GIVEN a FIFO on the way to the translations path
       WHEN init runs with --yes
       THEN it is refused saying what it is, and nothing is written`,
      async () => {
        makeFifo('src');

        await expect(runInit(options())).rejects.toThrow(
          'The translations path src/assets/i18n is, or lies inside, a FIFO',
        );
        expect(exists('transloco.config.ts')).toBe(false);
      },
      5000,
    );
  });

  describe('the config that extract would find', () => {
    const found = (file: string) =>
      new RegExp(`found in ${file.replace(/[.\\/]/g, '\\$&')}`);
    // The temp folder is taken to have no package.json in it or above it, which
    // is true of a machine whose temp folder lies under system folders only.
    const noManifestAbove = (folder: string) => {
      for (let current = folder; ; current = path.dirname(current)) {
        if (fs.existsSync(path.join(current, 'package.json'))) return false;

        if (path.dirname(current) === current) return true;
      }
    };
    const tmpIsClean = noManifestAbove(os.tmpdir());

    it.each([[false], [true]])(
      `GIVEN a config in src
       WHEN init runs (force: %j)
       THEN it is refused naming it, as extract reads it first, and nothing is written`,
      async (force) => {
        write('src/transloco.config.js', 'module.exports = { langs: ["en"] };');
        const before = tree();

        await expect(runInit(options({ force }))).rejects.toThrow(
          found(path.join('src', 'transloco.config.js')),
        );
        expect(tree()).toEqual(before);
      },
    );

    it(`GIVEN a config in src and a transloco.config.ts in the folder
        WHEN init runs with --force
        THEN the config in src is the one named, as it is the one that applies`, async () => {
      write('src/.translocorc.json', '{"langs": ["en"]}');
      write('transloco.config.ts', 'export default {};');

      await expect(runInit(options({ force: true }))).rejects.toThrow(
        found(path.join('src', '.translocorc.json')),
      );
      expect(read('transloco.config.ts')).toBe('export default {};');
    });

    it(`GIVEN a config in src that throws when it is loaded
        WHEN init runs with --force
        THEN it is refused with one line naming that file, and nothing is written`, async () => {
      write('src/transloco.config.js', 'throw new Error("boom at import");');
      const before = tree();

      await expect(runInit(options({ force: true }))).rejects.toThrow(
        new CliError(
          `Transloco Init: could not read ${path.join('src', 'transloco.config.js')} while looking for an existing Transloco config: boom at import`,
        ),
      );
      expect(tree()).toEqual(before);
    });

    it(`GIVEN a config in the source root of the default project
        WHEN init runs
        THEN it is the one found`, async () => {
      write(
        'angular.json',
        JSON.stringify({
          projects: { app: { sourceRoot: 'projects/app/src' } },
        }),
      );
      write(
        'projects/app/src/transloco.config.js',
        'module.exports = { langs: ["en"] };',
      );

      await expect(runInit(options())).rejects.toThrow(
        found(path.join('projects', 'app', 'src', 'transloco.config.js')),
      );
    });

    it(`GIVEN no workspace config
        WHEN init runs
        THEN nothing is said about the source root it falls back to`, async () => {
      await runInit(options());

      expect(printed().join('\n')).not.toContain('Unable to load workspace');
    });

    it.skipIf(!tmpIsClean)(
      `GIVEN a config above a folder, and no package.json anywhere
       WHEN init runs in the folder
       THEN the config is none of its business`,
      async () => {
        write('transloco.config.js', 'module.exports = { langs: ["en"] };');
        write('app/src/.gitkeep', '');
        process.chdir(path.join(dir, 'app'));

        await runInit(options());

        expect(exists('app/transloco.config.ts')).toBe(true);
      },
    );

    describe.each([
      {
        layout: 'a config in the working directory',
        files: ['app/transloco.config.js'],
        cwd: 'app',
        expected: 'transloco.config.js',
      },
      {
        layout: 'a config in src',
        files: ['app/src/transloco.config.js'],
        cwd: 'app',
        expected: path.join('src', 'transloco.config.js'),
      },
      {
        layout: 'a package.json in the working directory and a config above',
        files: ['app/package.json', 'transloco.config.js'],
        cwd: 'app',
        expected: undefined,
      },
      {
        layout: 'a package.json and a config above the working directory',
        files: ['package.json', 'transloco.config.js'],
        cwd: 'app',
        expected: path.join('..', 'transloco.config.js'),
      },
      {
        layout: 'a package.json one level up and a config two levels up',
        files: ['x/package.json', 'transloco.config.js'],
        cwd: 'x/app',
        expected: undefined,
      },
      {
        layout: 'a config above and no package.json anywhere',
        files: ['transloco.config.js'],
        cwd: 'app',
        expected: undefined,
        needsCleanTmp: true,
      },
    ])(
      'the keys manager and init on $layout',
      ({ files, cwd, expected, needsCleanTmp }) => {
        it.skipIf(needsCleanTmp && !tmpIsClean)(
          `GIVEN the layout
           WHEN the keys manager resolves its config and init runs
           THEN they agree on whether there is a config, and on which`,
          async () => {
            for (const file of files) {
              write(
                file,
                file.endsWith('package.json')
                  ? '{"name": "app"}'
                  : 'module.exports = { langs: ["zz"] };',
              );
            }

            fs.mkdirSync(path.join(dir, cwd, 'src', 'app'), {
              recursive: true,
            });
            process.chdir(path.join(dir, cwd));

            // What `transloco extract` goes by: its languages are the ones of
            // the config, when it found one
            const extractFound = resolveConfig({
              command: 'extract',
            }).langs?.includes('zz');
            const outcome = await runInit(options({ force: true })).then(
              () => undefined,
              (error: Error) => error.message,
            );

            expect(extractFound).toBe(expected !== undefined);
            expect(outcome === undefined).toBe(expected === undefined);

            if (expected !== undefined) {
              expect(outcome).toContain(`found in ${expected}`);
            }
          },
        );
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
