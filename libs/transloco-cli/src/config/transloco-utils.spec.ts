import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getGlobalConfig } from './transloco-utils';

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
});
