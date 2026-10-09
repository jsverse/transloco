import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';

import { runScopedLibs } from './scoped-libs.js';

const run = vi.hoisted(() => vi.fn());

vi.mock('../scoped-libs/index.js', () => ({ default: run }));

describe('runScopedLibs', () => {
  const originalCwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    vi.clearAllMocks();
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
      THEN it is no error: the library gets no libs, just as when started in a directory without a config`, async () => {
    fs.mkdirSync(path.join(dir, 'configs'));

    await runScopedLibs({ config: 'configs' });

    expect(run).toHaveBeenCalledExactlyOnceWith({
      watch: false,
      skipGitIgnoreUpdate: false,
      rootTranslationsPath: undefined,
      scopedLibs: undefined,
    });
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
    });
  });
});
