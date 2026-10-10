import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type TestContext,
} from 'vitest';

import { CliError } from '../errors.js';

import { runJoin, type JoinCommandOptions } from './join.js';

describe('runJoin', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-join-')),
    );
    process.chdir(dir);
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string | object) {
    const filePath = path.join(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    );
  }

  function writeConfig(config: object, file = 'transloco.config.js') {
    write(file, `module.exports = ${JSON.stringify(config)};`);
  }

  const read = (file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');
  const exists = (file: string) => fs.existsSync(path.join(dir, file));

  /** A root with a default language, a second one and a scope. */
  function writeTranslations(root = 'src/i18n') {
    write(`${root}/en.json`, { hello: 'hello' });
    write(`${root}/es.json`, { hello: 'hola' });
    write(`${root}/scope/en.json`, { bye: 'bye' });
    write(`${root}/scope/es.json`, { bye: 'adios' });
  }

  const options = (
    overrides: Partial<JoinCommandOptions> = {},
  ): JoinCommandOptions => ({
    translationsPath: 'src/i18n',
    outDir: 'dist-i18n',
    defaultLang: 'en',
    ...overrides,
  });

  async function failure(overrides: Partial<JoinCommandOptions> = {}) {
    try {
      runJoin(options(overrides));
    } catch (error) {
      return error as CliError;
    }

    throw new Error('Expected the command to fail');
  }

  describe('joining', () => {
    it(`GIVEN a root with a scope
        WHEN it runs
        THEN every language but the default one is written to the out folder`, async () => {
      writeTranslations();

      runJoin(options());

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['es.json']);
      expect(read('dist-i18n/es.json')).toBe(
        JSON.stringify({ hello: 'hola', scope: { bye: 'adios' } }, null, 2),
      );
    });

    it(`GIVEN includeDefaultLang
        WHEN it runs
        THEN the default language is written as well`, async () => {
      writeTranslations();

      runJoin(options({ includeDefaultLang: true }));

      expect(fs.readdirSync(path.join(dir, 'dist-i18n')).sort()).toEqual([
        'en.json',
        'es.json',
      ]);
    });

    it(`GIVEN a scopePathMap in the config
        WHEN it runs
        THEN the scopes are merged from the mapped folders`, async () => {
      write('src/i18n/es.json', { hello: 'hola' });
      write('libs/ui/i18n/es.json', { ok: 'vale' });
      writeConfig({ scopePathMap: { ui: 'libs/ui/i18n' } });

      runJoin(options());

      expect(JSON.parse(read('dist-i18n/es.json'))).toEqual({
        hello: 'hola',
        ui: { ok: 'vale' },
      });
    });

    it(`GIVEN an out folder holding files of an earlier run
        WHEN it runs
        THEN the folder is emptied first`, async () => {
      writeTranslations();
      write('dist-i18n/stale.json', '{}');
      write('dist-i18n/nested/old.json', '{}');

      runJoin(options());

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['es.json']);
    });

    it(`GIVEN an out folder that is nested
        WHEN it runs
        THEN the folders above it are created`, async () => {
      writeTranslations();

      runJoin(options({ outDir: 'build/i18n' }));

      expect(exists('build/i18n/es.json')).toBe(true);
    });

    it(`GIVEN an out folder that was already joined into
        WHEN it runs again
        THEN it holds the same files`, async () => {
      writeTranslations();

      runJoin(options());
      const first = read('dist-i18n/es.json');
      runJoin(options());

      expect(read('dist-i18n/es.json')).toBe(first);
    });
  });

  describe('the root and the default language', () => {
    it(`GIVEN a root in the config and none as an option
        WHEN it runs
        THEN the root of the config is joined`, async () => {
      writeTranslations('app/i18n');
      writeConfig({ rootTranslationsPath: 'app/i18n', defaultLang: 'en' });

      runJoin({ outDir: 'dist-i18n' });

      expect(exists('dist-i18n/es.json')).toBe(true);
      expect(exists('dist-i18n/en.json')).toBe(false);
    });

    it(`GIVEN a root in the config and another as an option
        WHEN it runs
        THEN the option wins`, async () => {
      writeTranslations('app/i18n');
      write('other/i18n/fr.json', { hello: 'salut' });
      writeConfig({ rootTranslationsPath: 'app/i18n' });

      runJoin({ translationsPath: 'other/i18n', outDir: 'dist-i18n' });

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['fr.json']);
    });

    it(`GIVEN a root neither in the config nor as an option
        WHEN it runs
        THEN it fails asking for one`, async () => {
      writeTranslations();

      const error = await failure({ translationsPath: undefined });

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Join: Pass --translations-path or set rootTranslationsPath in the Transloco config.',
      );
    });

    it(`GIVEN a default language in the config and another as an option
        WHEN it runs
        THEN the option wins`, async () => {
      writeTranslations();
      writeConfig({ defaultLang: 'es' });

      runJoin(options({ defaultLang: 'en' }));

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['es.json']);
    });

    it(`GIVEN a default language in the config and none as an option
        WHEN it runs
        THEN the language of the config is left out`, async () => {
      writeTranslations();
      writeConfig({ defaultLang: 'es' });

      runJoin(options({ defaultLang: undefined }));

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['en.json']);
    });

    it(`GIVEN includeDefaultLang and no default language anywhere
        WHEN it runs
        THEN it fails and leaves the out folder as it was`, async () => {
      writeTranslations();
      write('dist-i18n/keep.json', '{}');

      const error = await failure({
        defaultLang: undefined,
        includeDefaultLang: true,
      });

      expect(error.message).toBe(
        'Transloco Join: Please specify the default language of the project using --default-lang or the defaultLang option of the Transloco config.',
      );
      expect(exists('dist-i18n/keep.json')).toBe(true);
    });

    it(`GIVEN a config path that does not exist
        WHEN it runs
        THEN it fails naming the path`, async () => {
      writeTranslations();

      const error = await failure({ config: 'missing.config.js' });

      expect(error.message).toBe(
        'error: the --config path does not exist: missing.config.js',
      );
    });

    it(`GIVEN the path of a config outside the working directory
        WHEN it runs
        THEN that config is the one loaded`, async () => {
      writeTranslations('app/i18n');
      writeConfig(
        { rootTranslationsPath: 'app/i18n', defaultLang: 'es' },
        'configs/custom.config.js',
      );

      runJoin({ outDir: 'dist-i18n', config: 'configs/custom.config.js' });

      expect(fs.readdirSync(path.join(dir, 'dist-i18n'))).toEqual(['en.json']);
    });
  });

  describe('the out folder', () => {
    function writeSentinels() {
      writeTranslations();
      write('src/i18n/scope/keep.txt', 'keep');
      write('sentinel.txt', 'keep');
      write('apps/out/sentinel.txt', 'keep');
    }

    function expectUntouched() {
      expect(read('sentinel.txt')).toBe('keep');
      expect(read('apps/out/sentinel.txt')).toBe('keep');
      expect(read('src/i18n/scope/keep.txt')).toBe('keep');
      expect(read('src/i18n/es.json')).toContain('hola');
      expect(exists('src/i18n/scope/es.json')).toBe(true);
    }

    it.each([
      {
        scenario: 'the working directory',
        outDir: '.',
        reason: 'it is the current directory or one of its parents',
      },
      {
        scenario: 'the working directory, written as an absolute path',
        outDir: () => dir,
        reason: 'it is the current directory or one of its parents',
      },
      {
        scenario: 'the folder above the working directory',
        outDir: '..',
        reason: 'it is the current directory or one of its parents',
      },
      {
        scenario: 'a folder above the working directory',
        outDir: () => path.dirname(path.dirname(dir)),
        reason: 'it is the current directory or one of its parents',
      },
      {
        scenario: 'a folder outside the working directory',
        outDir: () => path.join(os.tmpdir(), 'transloco-cli-join-elsewhere'),
        reason: 'it is not inside the current directory',
      },
      {
        scenario: 'a sibling of the working directory',
        outDir: '../sibling',
        reason: 'it is not inside the current directory',
      },
      {
        scenario: 'the translations root',
        outDir: 'src/i18n',
        reason: 'it is, holds or lies inside the translations folder src/i18n',
      },
      {
        scenario: 'a folder above the translations root',
        outDir: 'src',
        reason: 'it is, holds or lies inside the translations folder src/i18n',
      },
      {
        scenario: 'a scope folder of the root',
        outDir: 'src/i18n/scope',
        reason: 'it is, holds or lies inside the translations folder src/i18n',
      },
      {
        scenario: 'a folder inside the translations root',
        outDir: 'src/i18n/out',
        reason: 'it is, holds or lies inside the translations folder src/i18n',
      },
      {
        scenario: 'the translations root, written differently',
        outDir: './src/../src/i18n/',
        reason: 'it is, holds or lies inside the translations folder src/i18n',
      },
    ])(
      `GIVEN $scenario as the out folder
       WHEN it runs
       THEN it is refused and nothing is touched`,
      async ({ outDir, reason }) => {
        writeSentinels();
        const out = typeof outDir === 'function' ? outDir() : outDir;

        const error = await failure({ outDir: out });

        expect(error).toBeInstanceOf(CliError);
        expect(error.exitCode).toBe(1);
        expect(error.message).toBe(
          `Transloco Join: Refusing to empty ${out}, ${reason}`,
        );
        expectUntouched();
        expect(exists('dist-i18n')).toBe(false);
      },
    );

    it(`GIVEN a folder that a scopePathMap maps to a scope as the out folder
        WHEN it runs
        THEN it is refused and nothing is touched`, async () => {
      writeSentinels();
      write('libs/ui/i18n/es.json', { ok: 'vale' });
      writeConfig({ scopePathMap: { ui: 'libs/ui/i18n' } });

      const error = await failure({ outDir: 'libs/ui' });

      expect(error.message).toBe(
        'Transloco Join: Refusing to empty libs/ui, it is, holds or lies inside the folder of the scope ui',
      );
      expect(read('libs/ui/i18n/es.json')).toContain('vale');
    });

    it(`GIVEN a file as the out folder
        WHEN it runs
        THEN it is refused and the file is kept`, async () => {
      writeSentinels();

      const error = await failure({ outDir: 'sentinel.txt' });

      expect(error.message).toBe(
        'Transloco Join: Refusing to empty sentinel.txt, it is a file',
      );
      expectUntouched();
    });

    it(`GIVEN an out folder inside the working directory and beside the root
        WHEN it runs
        THEN it is accepted`, async () => {
      writeSentinels();

      runJoin(options({ outDir: 'apps/out' }));

      expect(exists('apps/out/sentinel.txt')).toBe(false);
      expect(exists('apps/out/es.json')).toBe(true);
    });
  });

  describe('the out folder and symbolic links', () => {
    // A sibling of the working directory, to link to from inside of it.
    let outside: string;

    beforeEach(() => {
      outside = `${dir}-outside`;
      fs.mkdirSync(path.join(outside, 'sub'), { recursive: true });
      fs.writeFileSync(path.join(outside, 'sub', 'keep.json'), '{"a":1}');
      writeTranslations();
      write('src/i18n/admin/en.json', { title: 'Admin' });
      write('src/i18n/admin/es.json', { title: 'Administrador' });
      write('sentinel.txt', 'keep');
    });

    afterEach(() => {
      fs.rmSync(outside, { recursive: true, force: true });
    });

    /** Links created on a system that doesn't allow them skip the test. */
    function link(ctx: TestContext, target: string, file: string) {
      try {
        fs.symlinkSync(target, path.join(dir, file));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EPERM') ctx.skip();

        throw error;
      }
    }

    /** Every folder, link and file of the trees, with the content of the files hashed. */
    function listing() {
      const lines: string[] = [];
      const visit = (entry: string) => {
        const stats = fs.lstatSync(entry);

        if (stats.isSymbolicLink()) {
          lines.push(`${entry} -> ${fs.readlinkSync(entry)}`);
        } else if (stats.isDirectory()) {
          lines.push(`${entry}/`);
          fs.readdirSync(entry)
            .sort()
            .forEach((name) => visit(path.join(entry, name)));
        } else {
          const hash = createHash('sha1')
            .update(fs.readFileSync(entry))
            .digest('hex');

          lines.push(`${entry} ${hash}`);
        }
      };

      [dir, outside].forEach(visit);

      return lines.join('\n');
    }

    async function expectRefused(outDir: string, reason: string) {
      const before = listing();

      const error = await failure({ outDir });

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        `Transloco Join: Refusing to empty ${outDir}, ${reason}`,
      );
      expect(listing()).toBe(before);
    }

    it(`GIVEN a folder inside a link to the translations root as the out folder
        WHEN it runs
        THEN it is refused and nothing changes`, async (ctx) => {
      link(ctx, 'src/i18n', 'linkroot');

      await expectRefused(
        'linkroot/admin',
        'it is, holds or lies inside the translations folder src/i18n',
      );
    });

    it(`GIVEN a folder inside a link to a folder outside of the working directory as the out folder
        WHEN it runs
        THEN it is refused and nothing changes`, async (ctx) => {
      link(ctx, `../${path.basename(outside)}`, 'linkout');

      await expectRefused(
        'linkout/sub',
        'it is not inside the current directory',
      );
    });

    it.each([
      { target: 'src/i18n', scenario: 'the translations root' },
      {
        target: () => `../${path.basename(outside)}`,
        scenario: 'a folder outside',
      },
      { target: '.', scenario: 'the working directory' },
      { target: 'nowhere', scenario: 'nothing' },
    ])(
      `GIVEN a link to $scenario as the out folder
       WHEN it runs
       THEN it is refused and nothing changes`,
      async ({ target }, ctx: TestContext) => {
        link(ctx, typeof target === 'function' ? target() : target, 'linkdir');

        await expectRefused('linkdir', 'it is a symbolic link');
        expect(fs.lstatSync(path.join(dir, 'linkdir')).isSymbolicLink()).toBe(
          true,
        );
      },
    );

    it(`GIVEN a translations root reached through a symbolic link and an out folder given by the real path of the root
        WHEN it runs
        THEN it is refused and nothing changes`, async (ctx) => {
      link(ctx, 'src/i18n', 'linkroot');
      const before = listing();

      const error = await failure({
        translationsPath: 'linkroot',
        outDir: 'src/i18n',
      });

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Join: Refusing to empty src/i18n, it is, holds or lies inside the translations folder linkroot',
      );
      expect(listing()).toBe(before);
    });

    it(`GIVEN a folder inside a link that leads nowhere as the out folder
        WHEN it runs
        THEN it is refused and nothing changes`, async (ctx) => {
      link(ctx, 'nowhere', 'linkgone');

      await expectRefused(
        'linkgone/sub',
        'its real location cannot be resolved',
      );
    });

    it(`GIVEN a folder inside a file as the out folder
        WHEN it runs
        THEN it is refused and nothing changes`, async () => {
      await expectRefused('sentinel.txt/sub', 'it lies inside a file');
    });

    it(`GIVEN the scope folders reached through a link, and the folder they are in as the out folder
        WHEN it runs
        THEN it is refused and nothing changes`, async (ctx) => {
      link(ctx, '.', 'here');
      writeConfig({
        scopePathMap: { ui: path.join(dir, 'here', 'libs/ui/i18n') },
      });
      write('libs/ui/i18n/es.json', { ok: 'vale' });

      await expectRefused(
        'libs/ui',
        'it is, holds or lies inside the folder of the scope ui',
      );
    });

    it(`GIVEN the working directory reached through a link and an out folder written through it
        WHEN it runs
        THEN the folder is joined into`, async (ctx) => {
      const viaLink = `${dir}-link`;

      try {
        fs.symlinkSync(dir, viaLink);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EPERM') ctx.skip();

        throw error;
      }

      try {
        runJoin(options({ outDir: path.join(viaLink, 'dist-i18n') }));

        expect(exists('dist-i18n/es.json')).toBe(true);
      } finally {
        fs.rmSync(viaLink, { force: true });
      }
    });

    it(`GIVEN a link inside the working directory to a real folder inside it as the parent of the out folder
        WHEN it runs
        THEN the folder is joined into`, async (ctx) => {
      fs.mkdirSync(path.join(dir, 'apps'));
      link(ctx, 'apps', 'linkapps');

      runJoin(options({ outDir: 'linkapps/out' }));

      expect(exists('apps/out/es.json')).toBe(true);
    });
  });

  describe('problems', () => {
    it(`GIVEN a root that does not exist
        WHEN it runs
        THEN it fails naming the folder`, async () => {
      const error = await failure();

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Join: The translations folder does not exist: src/i18n',
      );
    });

    it(`GIVEN a root that is a file
        WHEN it runs
        THEN it fails saying it is not a folder`, async () => {
      write('src/i18n', '{}');

      const error = await failure();

      expect(error.message).toBe(
        'Transloco Join: The translations folder is not a folder: src/i18n',
      );
    });

    it(`GIVEN a root with no translation files
        WHEN it runs
        THEN it fails and leaves the out folder as it was`, async () => {
      write('src/i18n/.gitkeep', '');
      write('src/i18n/scope/es.json', {});
      write('dist-i18n/keep.json', '{}');

      const error = await failure();

      expect(error.message).toBe(
        'Transloco Join: No translation files (.json) found in src/i18n',
      );
      expect(exists('dist-i18n/keep.json')).toBe(true);
    });

    it(`GIVEN a root with only the default language
        WHEN it runs without includeDefaultLang
        THEN it fails and leaves the out folder as it was`, async () => {
      write('src/i18n/en.json', { hello: 'hello' });
      write('dist-i18n/keep.json', '{}');

      const error = await failure();

      expect(error.message).toBe(
        'Transloco Join: Only the default language was found in src/i18n, pass --include-default-lang to join it',
      );
      expect(exists('dist-i18n/keep.json')).toBe(true);
    });

    it(`GIVEN a key a scope shares with the root file
        WHEN it runs
        THEN it fails naming the key and both files, and leaves the out folder as it was`, async () => {
      writeTranslations();
      write('src/i18n/es.json', { hello: 'hola', scope: 'oops' });
      write('dist-i18n/keep.json', '{}');

      const error = await failure();

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        `Transloco Join: The key "scope" is defined in both ${path.join('src/i18n', 'es.json')} and ${path.join('src/i18n', 'scope', 'es.json')}, rename one and run the command again.`,
      );
      expect(exists('dist-i18n/keep.json')).toBe(true);
    });

    it(`GIVEN a translation file that is not valid JSON
        WHEN it runs
        THEN it fails naming the file, and leaves the out folder as it was`, async () => {
      writeTranslations();
      write('src/i18n/scope/es.json', '{ "bye": ');
      write('dist-i18n/keep.json', '{}');

      const error = await failure();

      expect(error.exitCode).toBe(1);
      expect(error.message).toMatch(
        new RegExp(
          `^Transloco Join: Invalid JSON in ${path.join('src/i18n', 'scope', 'es.json').replace(/[.\\/]/g, '\\$&')}: `,
        ),
      );
      expect(error.message).not.toContain('\n');
      expect(exists('dist-i18n/keep.json')).toBe(true);
    });

    it(`GIVEN any of these problems
        WHEN it runs
        THEN nothing is printed`, async () => {
      await failure();

      expect(log).not.toHaveBeenCalled();
      expect(stderr).not.toHaveBeenCalled();
    });
  });

  describe('the summary', () => {
    it(`GIVEN several languages
        WHEN it runs
        THEN one line names them and the out folder, and nothing is written to stderr`, async () => {
      writeTranslations();
      write('src/i18n/fr.json', { hello: 'salut' });

      runJoin(options({ outDir: 'build/i18n' }));

      expect(log).toHaveBeenCalledExactlyOnceWith(
        'Transloco Join: Joined es, fr into build/i18n',
      );
      expect(stderr).not.toHaveBeenCalled();
    });
  });
});
