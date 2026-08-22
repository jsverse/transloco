import path from 'node:path';

import fs from 'fs-extra';
import { po } from 'gettext-parser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setConfig } from '../config';
import { Config } from '../types';
import { generateKeys } from '../webpack-plugin/generate-keys';

const root = path.join(__dirname, '__generate-keys__');
const translationPath = `${root}/i18n`;
const scopePath = `${root}/custom/admin-i18n`;

function writePot(filePath: string, entries: Record<string, string>) {
  const body = Object.entries(entries)
    .map(([msgid, msgstr]) => `msgid "${msgid}"\nmsgstr "${msgstr}"\n`)
    .join('\n');

  fs.outputFileSync(filePath, `msgid ""\nmsgstr ""\n\n${body}`);
}

function readPot(filePath: string) {
  const parsed = po.parse(fs.readFileSync(filePath, 'utf-8'));

  return Object.entries(parsed.translations[''] ?? {})
    .filter(([msgid]) => msgid.length > 0)
    .reduce<Record<string, string>>(
      (acc, [msgid, entry]) => ({ ...acc, [msgid]: entry.msgstr.join('') }),
      {},
    );
}

function buildConfig(overrides: Partial<Config> = {}) {
  return {
    langs: ['en'],
    fileFormat: 'json',
    unflat: false,
    ...overrides,
  } as unknown as Parameters<typeof generateKeys>[0]['config'];
}

describe('generateKeys', () => {
  beforeEach(() => {
    setConfig({ sort: false } as Config);
    fs.removeSync(root);
  });

  afterEach(() => fs.removeSync(root));

  it('given a scoped key, when no scope path is mapped, then it should write to the default scope folder', () => {
    fs.outputJsonSync(`${translationPath}/en.json`, { globalOld: 'g' });
    fs.outputJsonSync(`${translationPath}/admin/en.json`, { adminOld: 'a' });

    generateKeys({
      translationPath,
      scopeToKeys: {
        __global: { globalNew: '' },
        admin: { adminNew: '' },
      },
      config: buildConfig(),
    });

    expect(fs.readJsonSync(`${translationPath}/admin/en.json`)).toEqual({
      adminNew: '',
      adminOld: 'a',
    });
  });

  it('given a global key, when writing, then it should not leak into scope folders', () => {
    fs.outputJsonSync(`${translationPath}/en.json`, { globalOld: 'g' });
    fs.outputJsonSync(`${translationPath}/admin/en.json`, { adminOld: 'a' });

    generateKeys({
      translationPath,
      scopeToKeys: { __global: { globalNew: '' } },
      config: buildConfig(),
    });

    expect(fs.readJsonSync(`${translationPath}/en.json`)).toEqual({
      globalNew: '',
      globalOld: 'g',
    });
    expect(fs.readJsonSync(`${translationPath}/admin/en.json`)).toEqual({
      adminOld: 'a',
    });
  });

  it('given a mapped scope path, when a stale file exists at the default path, then it should only write to the mapped path', () => {
    fs.outputJsonSync(`${translationPath}/admin/en.json`, { adminOld: 'a' });
    fs.outputJsonSync(`${scopePath}/en.json`, { adminOld: 'a' });

    generateKeys({
      translationPath,
      scopeToKeys: { __global: {}, admin: { adminNew: '' } },
      config: buildConfig({ scopePathMap: { admin: scopePath } }),
    });

    expect(fs.readJsonSync(`${scopePath}/en.json`)).toEqual({
      adminNew: '',
      adminOld: 'a',
    });
    expect(fs.readJsonSync(`${translationPath}/admin/en.json`)).toEqual({
      adminOld: 'a',
    });
  });

  it('given a file that is not a configured language, when writing, then it should be ignored', () => {
    fs.outputJsonSync(`${translationPath}/admin/en.json`, {});
    fs.outputJsonSync(`${translationPath}/admin/notALang.json`, {});

    generateKeys({
      translationPath,
      scopeToKeys: { __global: {}, admin: { adminNew: '' } },
      config: buildConfig(),
    });

    expect(fs.readJsonSync(`${translationPath}/admin/en.json`)).toEqual({
      adminNew: '',
    });
    expect(fs.readJsonSync(`${translationPath}/admin/notALang.json`)).toEqual(
      {},
    );
  });

  it('given a pot file format, when writing, then it should not parse the file as json', () => {
    writePot(`${translationPath}/en.pot`, { globalOld: 'g' });

    generateKeys({
      translationPath,
      scopeToKeys: { __global: { globalNew: '' } },
      config: buildConfig({ fileFormat: 'pot' }),
    });

    expect(readPot(`${translationPath}/en.pot`)).toEqual({
      globalOld: 'g',
      globalNew: '',
    });
  });

  describe('pot file format', () => {
    const potConfig = (overrides: Partial<Config> = {}) =>
      buildConfig({ fileFormat: 'pot', ...overrides });

    it('given a scoped key, when no scope path is mapped, then it should write to the default scope folder', () => {
      writePot(`${translationPath}/en.pot`, { globalOld: 'g' });
      writePot(`${translationPath}/admin/en.pot`, { adminOld: 'a' });

      generateKeys({
        translationPath,
        scopeToKeys: {
          __global: { globalNew: '' },
          admin: { adminNew: '' },
        },
        config: potConfig(),
      });

      expect(readPot(`${translationPath}/admin/en.pot`)).toEqual({
        adminOld: 'a',
        adminNew: '',
      });
      expect(readPot(`${translationPath}/en.pot`)).toEqual({
        globalOld: 'g',
        globalNew: '',
      });
    });

    it('given a mapped scope path, when a stale file exists at the default path, then it should only write to the mapped path', () => {
      writePot(`${translationPath}/admin/en.pot`, { adminOld: 'a' });
      writePot(`${scopePath}/en.pot`, { adminOld: 'a' });

      generateKeys({
        translationPath,
        scopeToKeys: { __global: {}, admin: { adminNew: '' } },
        config: potConfig({ scopePathMap: { admin: scopePath } }),
      });

      expect(readPot(`${scopePath}/en.pot`)).toEqual({
        adminOld: 'a',
        adminNew: '',
      });
      expect(readPot(`${translationPath}/admin/en.pot`)).toEqual({
        adminOld: 'a',
      });
    });

    it('given multiple configured languages, when writing, then it should update every language file', () => {
      writePot(`${translationPath}/en.pot`, { globalOld: 'g' });
      writePot(`${translationPath}/es.pot`, { globalOld: 'gs' });

      generateKeys({
        translationPath,
        scopeToKeys: { __global: { globalNew: '' } },
        config: potConfig({ langs: ['en', 'es'] }),
      });

      expect(readPot(`${translationPath}/en.pot`)).toEqual({
        globalOld: 'g',
        globalNew: '',
      });
      expect(readPot(`${translationPath}/es.pot`)).toEqual({
        globalOld: 'gs',
        globalNew: '',
      });
    });

    it('given a file that is not a configured language, when writing, then it should be ignored', () => {
      writePot(`${translationPath}/en.pot`, {});
      writePot(`${translationPath}/notALang.pot`, {});

      generateKeys({
        translationPath,
        scopeToKeys: { __global: { globalNew: '' } },
        config: potConfig(),
      });

      expect(readPot(`${translationPath}/en.pot`)).toEqual({ globalNew: '' });
      expect(readPot(`${translationPath}/notALang.pot`)).toEqual({});
    });

    it('given an empty pot file, when writing, then it should add the extracted keys', () => {
      fs.outputFileSync(`${translationPath}/en.pot`, '');

      generateKeys({
        translationPath,
        scopeToKeys: { __global: { globalNew: '' } },
        config: potConfig(),
      });

      expect(readPot(`${translationPath}/en.pot`)).toEqual({ globalNew: '' });
    });

    it('given an existing translated key, when the same key is extracted, then it should keep the existing value', () => {
      writePot(`${translationPath}/en.pot`, { greeting: 'Hello' });

      generateKeys({
        translationPath,
        scopeToKeys: { __global: { greeting: '', farewell: '' } },
        config: potConfig(),
      });

      expect(readPot(`${translationPath}/en.pot`)).toEqual({
        greeting: 'Hello',
        farewell: '',
      });
    });

    it('given unflat is enabled, when writing, then it should keep the msgids flat and preserve existing values', () => {
      setConfig({ sort: false, unflat: true } as Config);
      writePot(`${translationPath}/en.pot`, { 'a.b': 'x' });

      generateKeys({
        translationPath,
        scopeToKeys: { __global: { 'a.b': '', 'a.c': '' } },
        config: potConfig({ unflat: true }),
      });

      expect(readPot(`${translationPath}/en.pot`)).toEqual({
        'a.b': 'x',
        'a.c': '',
      });
    });
  });

  it('given unflat is enabled, when writing json, then it should nest the extracted keys', () => {
    setConfig({ sort: false, unflat: true } as Config);
    fs.outputJsonSync(`${translationPath}/en.json`, {});

    generateKeys({
      translationPath,
      scopeToKeys: { __global: { 'a.b': '' } },
      config: buildConfig({ unflat: true }),
    });

    expect(fs.readJsonSync(`${translationPath}/en.json`)).toEqual({
      a: { b: '' },
    });
  });
});
