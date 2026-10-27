import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { vi } from 'vitest';

import run from './transloco-scoped-libs.js';

describe('Scoped libs with misconfigured libraries', () => {
  const originalCwd = process.cwd();
  let dir: string;

  const write = (file: string, value: object) => {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), JSON.stringify(value));
  };

  beforeEach(() => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'scoped-libs-problems-')));
    // no i18n in its package.json
    write('libs/a/package.json', { name: 'a' });
    write('libs/b/package.json', {
      name: 'b',
      i18n: [{ scope: 'b', path: 'i18n' }],
    });
    write('libs/b/i18n/en.json', { hello: 'hello' });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it(`GIVEN a library without i18n, one without a package.json and a valid one after them
      WHEN the libraries are copied
      THEN each problem is reported and the valid library is still copied`, async () => {
    const onProblem = vi.fn();

    await run({
      watch: false,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'app/i18n/',
      scopedLibs: ['libs/a', 'libs/missing', 'libs/b'],
      onProblem,
    });

    expect(onProblem).toHaveBeenCalledTimes(2);
    expect(onProblem.mock.calls[0][0]).toContain(
      `${join('libs/a', 'package.json')} is missing i18n information.`,
    );
    expect(onProblem.mock.calls[1][0]).toBe(
      `${join('libs/missing', 'package.json')} does not exist.`,
    );
    expect(existsSync(join(dir, 'app/i18n/b/en.json'))).toBe(true);
  });

  it(`GIVEN a library whose package.json can't be parsed and a valid one after it
      WHEN the libraries are copied
      THEN it is reported as such and the valid library is still copied`, async () => {
    writeFileSync(join(dir, 'libs/a/package.json'), '{ not json');
    const onProblem = vi.fn();

    await run({
      watch: false,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'app/i18n/',
      scopedLibs: ['libs/a', 'libs/b'],
      onProblem,
    });

    expect(onProblem).toHaveBeenCalledExactlyOnceWith(
      `${join('libs/a', 'package.json')} is not valid JSON.`,
    );
    expect(existsSync(join(dir, 'app/i18n/b/en.json'))).toBe(true);
  });

  it(`GIVEN no scopedLibs
      WHEN the library runs
      THEN the missing configuration is reported`, async () => {
    const onProblem = vi.fn();

    await run({
      watch: false,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'app/i18n/',
      scopedLibs: undefined,
      onProblem,
    });

    expect(onProblem).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('Please add "scopedLibs"'),
    );
  });

  it(`GIVEN no problem handler, as the legacy bin runs it
      WHEN a library is misconfigured
      THEN the problem is printed to stdout as before`, async () => {
    await run({
      watch: false,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'app/i18n/',
      scopedLibs: ['libs/a', 'libs/b'],
    });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('is missing i18n information.'),
    );
    expect(existsSync(join(dir, 'app/i18n/b/en.json'))).toBe(true);
  });

  it.each([
    ['without a src', { dist: ['app/i18n'] }],
    ['without a dist, and no rootTranslationsPath', { src: 'libs/b' }],
  ])(
    `GIVEN a library %s
     WHEN the libraries are copied
     THEN the example of the problem is an ES module config`,
    async (_, lib) => {
      const onProblem = vi.fn();

      await run({
        watch: false,
        skipGitIgnoreUpdate: true,
        scopedLibs: [lib],
        onProblem,
      });

      expect(onProblem).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('export default {'),
      );
      expect(onProblem.mock.calls[0][0]).not.toContain('module.exports');
    },
  );

  it(`GIVEN a valid library
      WHEN its files are copied
      THEN the copy is logged with paths relative to the working directory`, async () => {
    await run({
      watch: false,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: 'app/i18n/',
      scopedLibs: ['libs/b'],
    });

    expect(console.log).toHaveBeenCalledWith(
      '✅ Copy translation from file:',
      expect.stringContaining('libs/b/i18n/en.json'),
      'to:',
      expect.stringContaining('app/i18n/b/en.json'),
    );
    const [, from, , to] = vi
      .mocked(console.log)
      .mock.calls.find(([text]) => text === '✅ Copy translation from file:')!;
    expect(stripVTControlCharacters(from)).toBe('libs/b/i18n/en.json');
    expect(stripVTControlCharacters(to)).toBe('app/i18n/b/en.json');
  });
});
