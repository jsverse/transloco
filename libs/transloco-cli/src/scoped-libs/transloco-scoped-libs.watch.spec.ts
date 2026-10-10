import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vi } from 'vitest';

import run from './transloco-scoped-libs.js';

describe('Scoped libs in watch mode', () => {
  const originalCwd = process.cwd();
  let dir: string;
  let stop: () => Promise<void>;

  const lib = () => join(dir, 'libs/core/src/i18n');
  const output = (file: string) => join(dir, 'app/i18n/core', file);
  const write = (file: string, value: object) =>
    writeFileSync(file, JSON.stringify(value));

  beforeEach(async () => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'scoped-libs-watch-')));
    mkdirSync(lib(), { recursive: true });
    mkdirSync(join(dir, 'app/i18n'), { recursive: true });
    write(join(dir, 'libs/core/package.json'), {
      name: '@test/core',
      i18n: [{ scope: 'core', path: 'src/i18n' }],
    });
    write(join(lib(), 'en.json'), { hello: 'hello' });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(dir);

    stop = await run({
      watch: true,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: './app/i18n/',
      scopedLibs: ['libs/core'],
    });
  });

  afterEach(async () => {
    await stop();
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it(`GIVEN the watch mode is on
      WHEN the library starts
      THEN the files that exist are copied`, () => {
    expect(JSON.parse(readFileSync(output('en.json'), 'utf-8'))).toEqual({
      hello: 'hello',
    });
  });

  it(`GIVEN the watch mode is on
      WHEN a translation file is added to the library
      THEN it is copied`, async () => {
    // The watcher may not be ready yet, so the file is written until it is seen
    await vi.waitFor(
      () => {
        write(join(lib(), 'es.json'), { hello: 'hola' });

        expect(existsSync(output('es.json'))).toBe(true);
      },
      { timeout: 10_000, interval: 250 },
    );

    expect(JSON.parse(readFileSync(output('es.json'), 'utf-8'))).toEqual({
      hello: 'hola',
    });
  });

  it(`GIVEN the watch mode is on
      WHEN a translation file of the library changes
      THEN the change is copied`, async () => {
    await vi.waitFor(
      () => {
        write(join(lib(), 'en.json'), { hello: 'hello again' });

        expect(JSON.parse(readFileSync(output('en.json'), 'utf-8'))).toEqual({
          hello: 'hello again',
        });
      },
      { timeout: 10_000, interval: 250 },
    );
  });

  it(`GIVEN the watch mode is on
      WHEN a file that is not JSON is added to the library
      THEN it is not copied`, async () => {
    writeFileSync(join(lib(), 'notes.txt'), 'not a translation');
    write(join(lib(), 'fr.json'), { hello: 'bonjour' });

    await vi.waitFor(
      () => {
        write(join(lib(), 'fr.json'), { hello: 'bonjour' });

        expect(existsSync(output('fr.json'))).toBe(true);
      },
      { timeout: 10_000, interval: 250 },
    );

    expect(existsSync(output('notes.json'))).toBe(false);
    expect(existsSync(output('notes.txt'))).toBe(false);
  });
});
