import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';

import { runScopedLibs } from './scoped-libs.js';

const run = vi.hoisted(() => vi.fn());

function stopWatching(watching: number) {
  return Object.assign(async () => {}, { watching });
}

vi.mock('../scoped-libs/index.js', () => ({ default: run }));

describe('runScopedLibs', () => {
  const originalCwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    run.mockResolvedValue(stopWatching(1));
    // The real path, as that's what `process.cwd()` reports once inside it.
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-scoped-libs-')),
    );
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function writeConfig(file: string, config: object) {
    const filePath = path.join(dir, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `module.exports = ${JSON.stringify(config)};`,
      'utf-8',
    );
  }

  it(`GIVEN a transloco config in the working directory and no options
      WHEN it runs
      THEN the libs of that config are copied once, updating .gitignore`, async () => {
    writeConfig('transloco.config.js', {
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
    });

    await runScopedLibs({});

    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: false,
      skipGitIgnoreUpdate: false,
      rootTranslationsPath: 'src/assets/i18n',
      scopedLibs: ['libs/core'],
      onProblem: expect.any(Function),
    });
  });

  it(`GIVEN the path of a config kept outside the working directory's root
      WHEN it runs
      THEN that config is the one loaded`, async () => {
    writeConfig('transloco.config.js', {
      rootTranslationsPath: 'root/i18n',
      scopedLibs: ['libs/root'],
    });
    writeConfig('configs/custom.config.js', {
      rootTranslationsPath: 'custom/i18n',
      scopedLibs: [{ src: 'libs/custom', dist: ['apps/a/i18n'] }],
    });

    await runScopedLibs({ config: 'configs/custom.config.js' });

    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: false,
      skipGitIgnoreUpdate: false,
      rootTranslationsPath: 'custom/i18n',
      scopedLibs: [{ src: 'libs/custom', dist: ['apps/a/i18n'] }],
      onProblem: expect.any(Function),
    });
  });

  it(`GIVEN a directory as the config path
      WHEN it runs
      THEN the config is searched for in that directory`, async () => {
    writeConfig('configs/transloco.config.js', {
      scopedLibs: ['libs/in-directory'],
    });

    await runScopedLibs({ config: 'configs' });

    expect(run).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ scopedLibs: ['libs/in-directory'] }),
    );
  });

  it(`GIVEN a directory without a config as the config path
      WHEN it runs
      THEN it fails asking for the libraries, as there is nothing to copy`, async () => {
    fs.mkdirSync(path.join(dir, 'configs'));

    const error = await runScopedLibs({ config: 'configs' }).catch((e) => e);

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: expect.stringContaining('"scopedLibs"'),
    });
    expect(run).not.toHaveBeenCalled();
  });

  it(`GIVEN a config with an empty scopedLibs list
      WHEN it runs
      THEN it fails asking for the libraries, as there is nothing to copy`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: [] });

    const error = await runScopedLibs({}).catch((e) => e);

    expect(error).toBeInstanceOf(CliError);
    expect(error.message).toContain('"scopedLibs"');
    expect(run).not.toHaveBeenCalled();
  });

  it(`GIVEN libraries the library reports problems for
      WHEN it runs
      THEN it fails with every problem, once all libraries were tried`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/a', 'libs/b'] });
    run.mockImplementationOnce(async ({ onProblem }) => {
      onProblem('libs/a is broken');
      onProblem('libs/b is broken');
    });

    const error = await runScopedLibs({}).catch((e) => e);

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: 'libs/a is broken\nlibs/b is broken',
    });
  });

  it(`GIVEN the watch mode and a library the library reports a problem for
      WHEN it runs
      THEN the problem is printed to stderr and it keeps running`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/a'] });
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    run.mockImplementationOnce(async ({ onProblem }) => {
      onProblem('libs/a is broken');

      return stopWatching(1);
    });

    await expect(runScopedLibs({ watch: true })).resolves.toBeUndefined();

    expect(stderr).toHaveBeenCalledExactlyOnceWith('libs/a is broken');
    stderr.mockRestore();
  });

  it(`GIVEN the watch mode and no library that could be watched
      WHEN it runs
      THEN it fails once the problems are printed, instead of ending with a success`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/a'] });
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    run.mockImplementationOnce(async ({ onProblem }) => {
      onProblem('libs/a is broken');

      return stopWatching(0);
    });

    const error = await runScopedLibs({ watch: true }).catch((e) => e);

    expect(stderr).toHaveBeenCalledExactlyOnceWith('libs/a is broken');
    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message: expect.stringContaining('Nothing could be watched'),
    });
    stderr.mockRestore();
  });

  it(`GIVEN no watch mode and no watcher
      WHEN it runs
      THEN it is no error`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/a'] });
    run.mockResolvedValueOnce(stopWatching(0));

    await expect(runScopedLibs({})).resolves.toBeUndefined();
  });

  it(`GIVEN a config path that does not exist, next to a config in the working directory
      WHEN it runs
      THEN it fails naming the path instead of falling back, and copies nothing`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/core'] });

    const error = await runScopedLibs({
      config: 'configs/missing.config.js',
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CliError);
    expect(error).toMatchObject({
      exitCode: 1,
      message:
        'error: the --config path does not exist: configs/missing.config.js',
    });
    expect(run).not.toHaveBeenCalled();
  });

  it(`GIVEN the watch and skip-gitignore options
      WHEN it runs
      THEN they are handed over under the names the library expects`, async () => {
    writeConfig('transloco.config.js', { scopedLibs: ['libs/core'] });

    await runScopedLibs({ watch: true, skipGitignore: true });

    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: true,
      skipGitIgnoreUpdate: true,
      rootTranslationsPath: undefined,
      scopedLibs: ['libs/core'],
      onProblem: expect.any(Function),
    });
  });
});
