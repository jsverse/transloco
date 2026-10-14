import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';

import { runSplit, type SplitCommandOptions } from './split.js';

describe('runSplit', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let log: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-split-')),
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
  const json = (value: object) => JSON.stringify(value, null, 2);

  /** A root with a scope, the files of which are about to be replaced. */
  function writeRoot(root = 'src/i18n') {
    write(`${root}/en.json`, { old: 'old' });
    write(`${root}/es.json`, { old: 'viejo' });
    write(`${root}/scope/en.json`, { old: 'old' });
    write(`${root}/scope/es.json`, { old: 'viejo' });
  }

  function writeJoined(source = 'dist-i18n') {
    write(`${source}/en.json`, { hello: 'hello', scope: { bye: 'bye' } });
    write(`${source}/es.json`, { hello: 'hola', scope: { bye: 'adios' } });
  }

  const options = (
    overrides: Partial<SplitCommandOptions> = {},
  ): SplitCommandOptions => ({
    translationsPath: 'src/i18n',
    source: 'dist-i18n',
    ...overrides,
  });

  function failure(overrides: Partial<SplitCommandOptions> = {}) {
    try {
      runSplit(options(overrides));
    } catch (error) {
      return error as CliError;
    }

    throw new Error('Expected the command to fail');
  }

  describe('splitting', () => {
    it(`GIVEN joined files and a root with a scope
        WHEN it runs
        THEN each scope folder and the root get their part`, () => {
      writeRoot();
      writeJoined();

      runSplit(options());

      expect(read('src/i18n/es.json')).toBe(json({ hello: 'hola' }));
      expect(read('src/i18n/en.json')).toBe(json({ hello: 'hello' }));
      expect(read('src/i18n/scope/es.json')).toBe(json({ bye: 'adios' }));
      expect(read('src/i18n/scope/en.json')).toBe(json({ bye: 'bye' }));
    });

    it(`GIVEN a scopePathMap in the config
        WHEN it runs
        THEN the scope goes to the mapped folder`, () => {
      write('src/i18n/es.json', {});
      write('libs/ui/i18n/es.json', {});
      write('dist-i18n/es.json', { hello: 'hola', ui: { ok: 'vale' } });
      writeConfig({ scopePathMap: { ui: 'libs/ui/i18n' } });

      runSplit(options());

      expect(read('libs/ui/i18n/es.json')).toBe(json({ ok: 'vale' }));
      expect(read('src/i18n/es.json')).toBe(json({ hello: 'hola' }));
    });

    it(`GIVEN a scope folder with no file for a language
        WHEN it runs
        THEN no file is created for it`, () => {
      write('src/i18n/es.json', {});
      write('src/i18n/scope/en.json', {});
      writeJoined();

      runSplit(options());

      expect(fs.readdirSync(path.join(dir, 'src/i18n/scope'))).toEqual([
        'en.json',
      ]);
    });

    it(`GIVEN a root file of a language that was not joined
        WHEN it runs
        THEN the file keeps its content`, () => {
      writeRoot();
      write('src/i18n/fr.json', { old: 'vieux' });
      writeJoined();

      runSplit(options());

      expect(read('src/i18n/fr.json')).toBe(json({ old: 'vieux' }));
    });

    it(`GIVEN files of other types in the root
        WHEN it runs
        THEN they are left alone`, () => {
      writeRoot();
      write('src/i18n/.gitkeep', '');
      write('src/i18n/README.md', '# notes');
      writeJoined();

      runSplit(options());

      expect(read('src/i18n/.gitkeep')).toBe('');
      expect(read('src/i18n/README.md')).toBe('# notes');
    });
  });

  describe('the root and the source', () => {
    it(`GIVEN a root in the config and none as an option
        WHEN it runs
        THEN the root of the config is split into`, () => {
      writeRoot('app/i18n');
      writeJoined();
      writeConfig({ rootTranslationsPath: 'app/i18n' });

      runSplit({ source: 'dist-i18n' });

      expect(read('app/i18n/es.json')).toBe(json({ hello: 'hola' }));
    });

    it(`GIVEN a root in the config and another as an option
        WHEN it runs
        THEN the option wins`, () => {
      writeRoot('app/i18n');
      writeRoot('other/i18n');
      writeJoined();
      writeConfig({ rootTranslationsPath: 'app/i18n' });

      runSplit({ translationsPath: 'other/i18n', source: 'dist-i18n' });

      expect(read('other/i18n/es.json')).toBe(json({ hello: 'hola' }));
      expect(read('app/i18n/es.json')).toContain('viejo');
    });

    it(`GIVEN a root neither in the config nor as an option
        WHEN it runs
        THEN it fails asking for one`, () => {
      const error = failure({ translationsPath: undefined });

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Split: Pass --translations-path or set rootTranslationsPath in the Transloco config.',
      );
    });

    it(`GIVEN a source other than the default
        WHEN it runs
        THEN the files of that folder are split`, () => {
      writeRoot();
      writeJoined('joined');

      runSplit(options({ source: 'joined' }));

      expect(read('src/i18n/es.json')).toBe(json({ hello: 'hola' }));
    });

    it(`GIVEN a config path that does not exist
        WHEN it runs
        THEN it fails naming the path`, () => {
      expect(failure({ config: 'missing.config.js' }).message).toBe(
        'error: the --config path does not exist: missing.config.js',
      );
    });
  });

  describe('problems', () => {
    it(`GIVEN a root that does not exist
        WHEN it runs
        THEN it fails naming the folder`, () => {
      writeJoined();

      const error = failure();

      expect(error).toBeInstanceOf(CliError);
      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Split: The translations folder does not exist: src/i18n',
      );
    });

    it(`GIVEN a source that does not exist
        WHEN it runs
        THEN it fails naming the folder and writes nothing`, () => {
      writeRoot();

      const error = failure();

      expect(error.exitCode).toBe(1);
      expect(error.message).toBe(
        'Transloco Split: The source folder does not exist: dist-i18n',
      );
      expect(read('src/i18n/es.json')).toContain('viejo');
    });

    it(`GIVEN a source that is a file
        WHEN it runs
        THEN it fails saying it is not a folder`, () => {
      writeRoot();
      write('dist-i18n', '{}');

      expect(failure().message).toBe(
        'Transloco Split: The source folder is not a folder: dist-i18n',
      );
    });

    it(`GIVEN a root with no translation files
        WHEN it runs
        THEN it fails`, () => {
      write('src/i18n/.gitkeep', '');
      writeJoined();

      expect(failure().message).toBe(
        'Transloco Split: No translation files (.json) found in src/i18n',
      );
    });

    it(`GIVEN a source with no translation files
        WHEN it runs
        THEN it fails and writes nothing`, () => {
      writeRoot();
      write('dist-i18n/.gitkeep', '');

      expect(failure().message).toBe(
        'Transloco Split: No translation files (.json) found in dist-i18n',
      );
      expect(read('src/i18n/es.json')).toContain('viejo');
    });

    it(`GIVEN a joined file that is not valid JSON
        WHEN it runs
        THEN it fails naming the file and writes nothing`, () => {
      writeRoot();
      writeJoined();
      write('dist-i18n/es.json', '{ "hello": ');

      const error = failure();

      expect(error.exitCode).toBe(1);
      expect(error.message).toMatch(
        /^Transloco Split: Invalid JSON in dist-i18n\/es\.json: /,
      );
      expect(error.message).not.toContain('\n');
      expect(read('src/i18n/es.json')).toContain('viejo');
      expect(read('src/i18n/en.json')).toContain('old');
    });

    it(`GIVEN any of these problems
        WHEN it runs
        THEN nothing is printed`, () => {
      failure();

      expect(log).not.toHaveBeenCalled();
      expect(stderr).not.toHaveBeenCalled();
    });
  });

  describe('the summary', () => {
    it(`GIVEN several languages
        WHEN it runs
        THEN one line names them, the source and the root, and nothing is written to stderr`, () => {
      writeRoot();
      writeJoined('joined');

      runSplit(options({ source: 'joined' }));

      expect(log).toHaveBeenCalledExactlyOnceWith(
        'Transloco Split: Split en, es from joined into src/i18n',
      );
      expect(stderr).not.toHaveBeenCalled();
    });
  });
});
