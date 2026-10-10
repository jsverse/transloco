import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliError } from '../errors.js';
import { resolveConfig } from '../keys-manager/utils/resolve-config.js';

import { ConfigLoadError } from './load-error.js';
import { searchGlobalConfig } from './transloco-utils.js';

describe('a config that fails to load', () => {
  const originalCwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    // The real path, as that's what `process.cwd()` reports once inside it
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-load-error-')),
    );
    fs.mkdirSync(path.join(dir, 'src', 'app'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), '{"name": "app"}');
    process.chdir(dir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const write = (file: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  const resolve = (config?: string) =>
    resolveConfig({ command: 'extract', ...(config ? { config } : {}) });
  const failure = (run: () => unknown) => {
    try {
      run();
    } catch (error) {
      return error as Error;
    }

    throw new Error('Nothing was thrown');
  };

  describe.each([
    ['a syntax error', 'module.exports = {', '[^\\n]+'],
    [
      'an exception at import',
      'throw new Error("boom at import");',
      'boom at import',
    ],
  ])('with %s', (_, content, reason) => {
    it(`GIVEN a config found without --config
        WHEN the keys manager resolves its config
        THEN the error is one line, and names the file`, () => {
      write('transloco.config.js', content);

      const error = failure(() => resolve());

      expect(error).toBeInstanceOf(CliError);
      expect(error.message).toMatch(
        new RegExp(
          `^Transloco: could not load the config transloco\\.config\\.js: ${reason}$`,
        ),
      );
    });

    it(`GIVEN the config given with --config
        WHEN the keys manager resolves its config
        THEN the error is one line, and names the file`, () => {
      write('configs/custom.js', content);

      const error = failure(() => resolve('configs/custom.js'));

      expect(error.message).toMatch(
        new RegExp(
          `^Transloco: could not load the config ${path.join('configs', 'custom').replace(/[\\/]/g, '\\$&')}\\.js: ${reason}$`,
        ),
      );
    });
  });

  it(`GIVEN a config in src that throws
      WHEN the config is searched
      THEN the file is named relative to the working directory, with its folder`, () => {
    write('src/transloco.config.cjs', 'throw new Error("boom");');

    const error = failure(() => searchGlobalConfig('src'));

    expect(error).toBeInstanceOf(ConfigLoadError);
    expect(error).toMatchObject({
      file: path.join(dir, 'src', 'transloco.config.cjs'),
      reason: 'boom',
      message: `Transloco: could not load the config ${path.join('src', 'transloco.config.cjs')}: boom`,
    });
  });

  it(`GIVEN a JSON config that is no valid JSON
      WHEN the keys manager resolves its config
      THEN the file is named once, in one line`, () => {
    write('.translocorc.json', '{\n  "langs": \n}');

    const error = failure(() => resolve());

    expect(error.message).toMatch(
      /^Transloco: could not load the config \.translocorc\.json: [^\n]+$/,
    );
    expect(error.message.match(/translocorc\.json/g)).toHaveLength(1);
  });

  it(`GIVEN a folder with files that a search passes by and one that throws
      WHEN the config is searched
      THEN the one that throws is named, not the first one in the folder`, () => {
    write('.translocorc.json', '');
    write('transloco.config.js', 'throw new Error("late");');

    expect(failure(() => searchGlobalConfig())).toMatchObject({
      file: path.join(dir, 'transloco.config.js'),
    });
  });

  it(`GIVEN a config whose langs hold a comma
      WHEN the keys manager resolves its config
      THEN they are taken as they are, as only typed values are checked`, () => {
    write('transloco.config.js', 'module.exports = { langs: ["en,es"] };');

    expect(resolve().langs).toEqual(['en,es']);
  });
});
