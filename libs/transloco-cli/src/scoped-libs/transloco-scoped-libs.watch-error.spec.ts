import { EventEmitter } from 'node:events';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vi } from 'vitest';

const watchers = vi.hoisted(() => [] as unknown[]);

vi.mock('chokidar', async () => {
  const { EventEmitter } = await import('node:events');
  const watch = () => {
    const watcher = Object.assign(new EventEmitter(), {
      close: async () => undefined,
    });
    watchers.push(watcher);

    return watcher;
  };

  return { default: { watch } };
});

import run from './transloco-scoped-libs.js';

describe('Scoped libs watcher errors', () => {
  const originalCwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'scoped-libs-error-')));
    mkdirSync(join(dir, 'libs/core/src/i18n'), { recursive: true });
    mkdirSync(join(dir, 'app/i18n'), { recursive: true });
    writeFileSync(
      join(dir, 'libs/core/package.json'),
      JSON.stringify({
        name: '@test/core',
        i18n: [{ scope: 'core', path: 'src/i18n' }],
      }),
    );
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    watchers.length = 0;
  });

  it(`GIVEN the watch mode is on
      WHEN the watcher emits an error such as ENOSPC
      THEN it is reported through onProblem and nothing is thrown`, async () => {
    const onProblem = vi.fn();
    const stop = await run({
      watch: true,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: './app/i18n/',
      scopedLibs: ['libs/core'],
      onProblem,
    });

    expect(() =>
      (watchers[0] as EventEmitter).emit(
        'error',
        new Error('ENOSPC: System limit for number of file watchers reached'),
      ),
    ).not.toThrow();

    expect(onProblem).toHaveBeenCalledExactlyOnceWith(
      'libs/core: ENOSPC: System limit for number of file watchers reached',
    );
    await stop();
  });
});
