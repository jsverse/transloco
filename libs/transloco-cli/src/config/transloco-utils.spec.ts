import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  findGlobalConfigFile,
  getGlobalConfig,
  searchGlobalConfig,
} from './transloco-utils.js';

const TS_CONFIG = `export default { rootTranslationsPath: 'src/assets/i18n/', langs: ['en', 'es'] };`;

describe('getGlobalConfig', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-utils-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: string) {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  it(`GIVEN a directory containing a transloco.config.ts
      WHEN the config is resolved from the directory
      THEN it returns the file's config`, () => {
    write('transloco.config.ts', TS_CONFIG);

    expect(getGlobalConfig(dir)).toEqual({
      rootTranslationsPath: 'src/assets/i18n/',
      langs: ['en', 'es'],
    });
  });

  it(`GIVEN a path pointing directly at a transloco.config.ts file
      WHEN the config is resolved from the file path
      THEN it returns the file's config`, () => {
    const file = write('transloco.config.ts', TS_CONFIG);

    expect(getGlobalConfig(file)).toEqual({
      rootTranslationsPath: 'src/assets/i18n/',
      langs: ['en', 'es'],
    });
  });

  it(`GIVEN a path pointing at a config file with a custom name
      WHEN the config is resolved from the file path
      THEN it returns the file's config`, () => {
    const file = write('i18n.custom.json', '{"defaultLang": "fr"}');

    expect(getGlobalConfig(file)).toEqual({ defaultLang: 'fr' });
  });

  it(`GIVEN a relative path to a config file
      WHEN the config is resolved
      THEN it is resolved against the current working directory`, () => {
    write('transloco.config.ts', TS_CONFIG);
    const relative = path.relative(
      process.cwd(),
      path.join(dir, 'transloco.config.ts'),
    );

    expect(getGlobalConfig(relative).langs).toEqual(['en', 'es']);
  });

  it(`GIVEN a path pointing at an empty config file
      WHEN the config is resolved from the file path
      THEN it returns an empty config`, () => {
    const file = write('transloco.config.ts', '');

    expect(getGlobalConfig(file)).toEqual({});
  });

  it(`GIVEN a JSON config with a top-level "default" key
      WHEN the config is resolved
      THEN the config is returned as-is`, () => {
    const file = write(
      '.translocorc.json',
      '{"default": "en", "defaultLang": "fr"}',
    );

    expect(getGlobalConfig(file)).toEqual({
      default: 'en',
      defaultLang: 'fr',
    });
  });

  it(`GIVEN a path that goes through a file
      WHEN the config is resolved
      THEN the search reports ENOTDIR`, () => {
    const file = write('transloco.config.ts', TS_CONFIG);

    expect(() => getGlobalConfig(path.join(file, 'nested'))).toThrow(
      expect.objectContaining({ code: 'ENOTDIR' }),
    );
  });

  it(`GIVEN a directory without a transloco config
      WHEN the config is resolved
      THEN it returns an empty config`, () => {
    expect(getGlobalConfig(dir)).toEqual({});
  });

  it(`GIVEN a config in the parent of the directory
      WHEN the config is resolved from the directory
      THEN the parent is not searched`, () => {
    write('transloco.config.ts', TS_CONFIG);
    fs.mkdirSync(path.join(dir, 'src'));

    expect(getGlobalConfig(path.join(dir, 'src'))).toEqual({});
  });
});

describe('findGlobalConfigFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-utils-find-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, content: string) {
    const filePath = path.join(dir, name);

    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  it(`GIVEN a directory containing a transloco.config.ts
      WHEN the config file is looked for
      THEN its path is returned`, () => {
    const file = write('transloco.config.ts', TS_CONFIG);

    expect(findGlobalConfigFile(dir)).toBe(file);
  });

  it(`GIVEN a config in the transloco key of package.json
      WHEN the config file is looked for
      THEN the package.json is the file`, () => {
    const file = write('package.json', '{"transloco": {"langs": ["en"]}}');

    expect(findGlobalConfigFile(dir)).toBe(file);
  });

  it(`GIVEN a package.json with no transloco key
      WHEN the config file is looked for
      THEN there is none`, () => {
    write('package.json', '{"name": "app"}');

    expect(findGlobalConfigFile(dir)).toBeUndefined();
  });

  it(`GIVEN an empty transloco.config.ts
      WHEN the config file is looked for
      THEN there is none, as the config is empty`, () => {
    write('transloco.config.ts', '');

    expect(findGlobalConfigFile(dir)).toBeUndefined();
  });

  it(`GIVEN a directory without a transloco config
      WHEN the config file is looked for
      THEN there is none`, () => {
    expect(findGlobalConfigFile(dir)).toBeUndefined();
  });

  it(`GIVEN a folder inside a project that has a config at its root
      WHEN the config file is looked for from the folder
      THEN the config of the project is found`, () => {
    const file = write('transloco.config.ts', TS_CONFIG);
    write('package.json', '{"name": "app"}');
    fs.mkdirSync(path.join(dir, 'src', 'app'), { recursive: true });

    expect(findGlobalConfigFile(path.join(dir, 'src', 'app'))).toBe(file);
  });

  it(`GIVEN a folder with a package.json of its own below a config
      WHEN the config file is looked for from the folder
      THEN the search stops at that package.json`, () => {
    write('transloco.config.ts', TS_CONFIG);
    fs.mkdirSync(path.join(dir, 'libs', 'ui'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'libs', 'ui', 'package.json'), '{}');

    expect(findGlobalConfigFile(path.join(dir, 'libs', 'ui'))).toBeUndefined();
  });

  it(`GIVEN a relative directory
      WHEN the config file is looked for
      THEN it is resolved against the working directory`, () => {
    const file = write('transloco.config.ts', TS_CONFIG);

    expect(findGlobalConfigFile(path.relative(process.cwd(), dir))).toBe(file);
  });

  it(`GIVEN no directory
      WHEN the config file is looked for
      THEN the working directory is searched`, () => {
    const cwd = process.cwd();

    try {
      process.chdir(dir);
      const file = write('transloco.config.ts', TS_CONFIG);

      expect(findGlobalConfigFile()).toBe(fs.realpathSync(file));
    } finally {
      process.chdir(cwd);
    }
  });
});

describe('searchGlobalConfig', () => {
  let dir: string;
  let cwd: string;

  beforeEach(() => {
    cwd = process.cwd();
    // the real path, as the working directory always is one (/var is /private/var on macOS)
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-utils-search-')),
    );
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(file: string, content: string) {
    const filePath = path.resolve(dir, file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');

    return filePath;
  }

  function config(...langs: string[]) {
    return `export default { langs: ${JSON.stringify(langs)} };`;
  }

  it(`GIVEN a config in the directory
      WHEN the config is searched from the directory
      THEN the config and its file are returned`, () => {
    const file = write('src/transloco.config.ts', config('en', 'es'));

    expect(searchGlobalConfig('src')).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });

  it(`GIVEN a config in the working directory only
      WHEN the config is searched from a directory below it
      THEN the config of the working directory is found`, () => {
    const file = write('transloco.config.ts', config('en', 'es'));
    fs.mkdirSync(path.join(dir, 'apps/web/src'), { recursive: true });

    expect(searchGlobalConfig('apps/web/src')).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });

  it(`GIVEN configs in the directory and in the working directory
      WHEN the config is searched from the directory
      THEN the config of the directory wins`, () => {
    write('transloco.config.ts', config('en'));
    const file = write('apps/web/src/transloco.config.ts', config('fr'));

    expect(searchGlobalConfig('apps/web/src')).toEqual({
      config: { langs: ['fr'] },
      filepath: file,
    });
  });

  it(`GIVEN configs in two parents of the directory
      WHEN the config is searched from the directory
      THEN the closest one wins`, () => {
    write('transloco.config.ts', config('en'));
    const file = write('apps/web/transloco.config.ts', config('de'));
    fs.mkdirSync(path.join(dir, 'apps/web/src'), { recursive: true });

    expect(searchGlobalConfig('apps/web/src')).toEqual({
      config: { langs: ['de'] },
      filepath: file,
    });
  });

  it(`GIVEN an empty config in the directory and a config in the working directory
      WHEN the config is searched from the directory
      THEN the empty file is skipped`, () => {
    write('src/transloco.config.ts', '');
    const file = write('transloco.config.ts', config('en', 'es'));

    expect(searchGlobalConfig('src')).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });

  it(`GIVEN a package.json with a transloco key in the working directory
      WHEN the config is searched from a directory below it
      THEN the package.json is the file`, () => {
    const file = write('package.json', '{"transloco": {"langs": ["it"]}}');
    fs.mkdirSync(path.join(dir, 'src'));

    expect(searchGlobalConfig('src')).toEqual({
      config: { langs: ['it'] },
      filepath: file,
    });
  });

  it(`GIVEN no config below the working directory
      WHEN the config is searched
      THEN an empty config without a file is returned`, () => {
    fs.mkdirSync(path.join(dir, 'src'));

    expect(searchGlobalConfig('src')).toEqual({ config: {} });
  });

  it(`GIVEN a config above the working directory
      WHEN the config is searched from a directory below the working directory
      THEN the config above is not used`, () => {
    write('transloco.config.ts', config('en', 'es'));
    const workspace = fs.mkdtempSync(path.join(dir, 'workspace-'));
    fs.mkdirSync(path.join(workspace, 'src'));
    process.chdir(workspace);

    expect(searchGlobalConfig('src')).toEqual({ config: {} });
  });

  it(`GIVEN a directory outside the working directory
      WHEN the config is searched from it
      THEN its parents are skipped and the working directory is searched next`, () => {
    const outside = fs.mkdtempSync(path.join(dir, 'outside-'));
    const workspace = fs.mkdtempSync(path.join(dir, 'workspace-'));
    fs.mkdirSync(path.join(outside, 'src'));
    write(path.join(outside, 'transloco.config.ts'), config('fr'));
    process.chdir(workspace);

    expect(searchGlobalConfig(path.join(outside, 'src'))).toEqual({
      config: {},
    });

    const file = write(
      path.join(workspace, 'transloco.config.ts'),
      config('en', 'es'),
    );

    expect(searchGlobalConfig(path.join(outside, 'src'))).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });

  it(`GIVEN a directory whose name starts with two dots inside the working directory
      WHEN the config is searched from it
      THEN it is not taken for a directory outside the working directory`, () => {
    const file = write('transloco.config.ts', config('en', 'es'));
    fs.mkdirSync(path.join(dir, '..src'));

    expect(searchGlobalConfig('..src')).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });

  it(`GIVEN no directory
      WHEN the config is searched
      THEN the working directory is searched`, () => {
    const file = write('transloco.config.ts', config('en', 'es'));

    expect(searchGlobalConfig()).toEqual({
      config: { langs: ['en', 'es'] },
      filepath: file,
    });
  });
});
