import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collectOutput } from './tests/program-harness.js';

/**
 * Tripwires: a mock factory only runs when something imports its module, so
 * each of them records the import of a module that has to be loaded on demand.
 * The built bin gets the complete picture (`tests/built-bin`), this is the
 * quick check that runs with the unit tests.
 */
const loaded: string[] = [];

/**
 * The keys manager and what only it needs. Its entries are stubbed, and stand
 * in for everything below them.
 */
const stubbed: Record<string, () => object> = {
  '@angular/compiler': () => ({}),
  // Requires @angular/compiler as a peer, so loading it loads the compiler too.
  '@jsverse/angular-utils': () => ({}),
  // Loads `typescript` with `require`, which a mock of the package wouldn't see.
  './keys-manager/utils/typescript.js': () => ({ default: {} }),
  cheerio: () => ({}),
  './keys-manager/index.js': () => ({}),
  './keys-manager/keys-builder/index.js': () => ({
    buildTranslationFiles: vi.fn(),
  }),
  './keys-manager/keys-detective/index.js': () => ({
    findMissingKeys: vi.fn(),
  }),
  './keys-manager/keys-builder/build-keys.js': () => ({ buildKeys: vi.fn() }),
  './keys-manager/utils/resolve-config.js': () => ({ resolveConfig: vi.fn() }),
};

/** `src/validator/index.ts` => `./validator/index.js`, for every module below the directory. */
function modulesOf(directory: string): string[] {
  return fs
    .readdirSync(path.join(import.meta.dirname, directory), {
      withFileTypes: true,
    })
    .flatMap((entry) => {
      const entryPath = `${directory}/${entry.name}`;

      if (entry.isDirectory()) {
        // Never entered: the specs of the keys manager write and delete
        // fixtures below `tests` while this one may be listing it.
        return entry.name === 'tests' ? [] : modulesOf(entryPath);
      }

      return /(?<!\.spec|\.d)\.ts$/.test(entry.name)
        ? [`./${entryPath.replace(/\.ts$/, '.js')}`]
        : [];
    });
}

/**
 * The runners, every module of the tools behind them and their packages:
 * recorded, then loaded for real. Listing the modules of the keys manager one
 * by one is what catches a runner importing a single helper from it.
 */
const recorded = [
  ...[
    'keys-manager',
    'validator',
    'optimize',
    'scoped-libs',
    'translation-files',
    'config',
    'utils',
  ]
    .flatMap(modulesOf)
    .filter((id) => !(id in stubbed)),
  './commands/extract.js',
  './commands/find.js',
  './commands/validate.js',
  './commands/optimize.js',
  './commands/scoped-libs.js',
  './commands/join.js',
  './commands/split.js',
  './commands/translation-folders.js',
  './peers.js',
  'find-duplicated-property-keys',
  'glob',
  'flat',
  'cosmiconfig',
  'chokidar',
  'yocto-spinner',
  'cli-table3',
  'gettext-parser',
  'deep-diff',
  'debug',
  'jsonc-parser',
];

/** `./commands/validate.js` => `commands/validate` */
function nameOf(id: string) {
  return id.replace(/^\.\//, '').replace(/\.js$/, '');
}

/** Commander exits after printing the help or the version, here it throws instead. */
async function run(...args: string[]) {
  const { createProgram } = await import('./program.js');
  const program = createProgram();

  collectOutput(program);

  try {
    await program.parseAsync(args, { from: 'user' });
  } catch (error) {
    if ((error as { exitCode?: number }).exitCode === undefined) {
      throw error;
    }
  }
}

describe('lazy loading', () => {
  let dir: string;

  beforeEach(() => {
    // Every test arms the tripwires anew and starts from nothing loaded,
    // whatever the tests before it imported.
    vi.resetModules();
    loaded.length = 0;

    for (const [id, stub] of Object.entries(stubbed)) {
      vi.doMock(id, () => {
        loaded.push(nameOf(id));

        return stub();
      });
    }
    for (const id of recorded) {
      vi.doMock(id, async (original) => {
        loaded.push(nameOf(id));

        return original();
      });
    }

    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-lazy-'));
    fs.writeFileSync(path.join(dir, 'en.json'), '{"a": {"b": "c"}}');
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const id of [...Object.keys(stubbed), ...recorded]) {
      vi.doUnmock(id);
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it(`GIVEN the program was only created
      WHEN nothing has run yet
      THEN no runner and none of their packages were loaded with it`, async () => {
    const { createProgram } = await import('./program.js');

    createProgram();

    expect(loaded).toEqual([]);
  });

  it.each(
    [
      ['--help'],
      ['--version'],
      ['help', 'extract'],
      ['extract', '--help'],
      ['find', '--help'],
      ['validate', '--help'],
      ['optimize', '--help'],
      ['scoped-libs', '--help'],
      ['join', '--help'],
      ['split', '--help'],
      // rejected by the argument parser
      ['extract', '--add-missing-keys'],
      ['find', '--replace'],
      ['translate'],
    ].map((args) => [args.join(' '), args] as const),
  )(
    `GIVEN the arguments "%s"
     WHEN the program runs
     THEN no runner and none of their packages are loaded`,
    async (_, args) => {
      await run(...args);

      expect(loaded).toEqual([]);
    },
  );

  it(`GIVEN a translation file
      WHEN it is validated
      THEN only the validate runner and the validator's package are loaded`, async () => {
    await run('validate', path.join(dir, 'en.json'));

    expect([...loaded].sort()).toEqual([
      'commands/validate',
      'find-duplicated-property-keys',
      'validator/index',
      'validator/transloco-validator',
    ]);
  });

  it(`GIVEN a directory of translation files
      WHEN it is optimized
      THEN only the optimize runner and the optimizer's packages are loaded`, async () => {
    await run('optimize', dir);

    expect(fs.readFileSync(path.join(dir, 'en.json'), 'utf-8')).toBe(
      '{"a.b":"c"}',
    );
    expect([...loaded].sort()).toEqual([
      'commands/optimize',
      'flat',
      'glob',
      'optimize/index',
      'optimize/transloco-optimize',
    ]);
  });

  describe('translation folders', () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
      fs.mkdirSync(path.join(dir, 'i18n', 'scope'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'i18n', 'es.json'), '{"a":"b"}');
      fs.writeFileSync(path.join(dir, 'i18n', 'scope', 'es.json'), '{"c":"d"}');
    });

    afterEach(() => {
      process.chdir(originalCwd);
    });

    it(`GIVEN a folder of translation files
        WHEN it is joined
        THEN only the join runner, the core and the config reader are loaded`, async () => {
      await run('--cwd', dir, 'join', '--translations-path', 'i18n');

      expect(
        JSON.parse(
          fs.readFileSync(path.join(dir, 'dist-i18n', 'es.json'), 'utf-8'),
        ),
      ).toEqual({ a: 'b', scope: { c: 'd' } });
      expect([...loaded].sort()).toEqual([
        'commands/join',
        'commands/translation-folders',
        'config/index',
        'config/transloco-utils',
        'cosmiconfig',
        'translation-files/index',
        'translation-files/join',
        'translation-files/node-file-reader',
        'translation-files/shared',
        'translation-files/split',
        'utils/file-system',
      ]);
    });

    it(`GIVEN a folder of joined translation files
        WHEN it is split
        THEN only the split runner, the core and the config reader are loaded`, async () => {
      fs.mkdirSync(path.join(dir, 'dist-i18n'));
      fs.writeFileSync(
        path.join(dir, 'dist-i18n', 'es.json'),
        '{"a":"b","scope":{"c":"e"}}',
      );

      await run('--cwd', dir, 'split', '--translations-path', 'i18n');

      expect(
        JSON.parse(
          fs.readFileSync(path.join(dir, 'i18n', 'scope', 'es.json'), 'utf-8'),
        ),
      ).toEqual({ c: 'e' });
      expect([...loaded].sort()).toEqual([
        'commands/split',
        'commands/translation-folders',
        'config/index',
        'config/transloco-utils',
        'cosmiconfig',
        'translation-files/index',
        'translation-files/join',
        'translation-files/node-file-reader',
        'translation-files/shared',
        'translation-files/split',
        'utils/file-system',
      ]);
    });
  });

  it(`GIVEN the extract command
      WHEN the program runs
      THEN its runner loads the peers check and the keys builder, which proves the tripwires are armed`, async () => {
    await run('extract');

    expect([...loaded].sort()).toEqual([
      'commands/extract',
      'keys-manager/keys-builder/index',
      'peers',
    ]);
  });

  it(`GIVEN the find command
      WHEN the program runs
      THEN its runner loads the peers check and the keys detective`, async () => {
    await run('find');

    expect([...loaded].sort()).toEqual([
      'commands/find',
      'keys-manager/keys-detective/index',
      'peers',
    ]);
  });
});
