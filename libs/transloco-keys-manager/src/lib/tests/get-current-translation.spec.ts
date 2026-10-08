import os from 'os';
import path from 'path';

import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWarn = vi.fn();
vi.mock('../utils/logger', () => ({
  getLogger: () => ({ warn: mockWarn }),
}));

let mockConfig: any = {};
vi.mock('../config', () => ({
  getConfig: () => mockConfig,
}));

import { getCurrentTranslation } from '../keys-builder/utils/get-current-translation';

describe('getCurrentTranslation', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tkm-current-translation-'));
    mockConfig = { unflat: false };
    mockWarn.mockClear();
  });

  afterEach(() => {
    fs.removeSync(dir);
  });

  it(`GIVEN a json file with __proto__ keys at the top level and nested
      WHEN the translation is read
      THEN both are dropped, the rest is kept and one warning names the file`, () => {
    const file = path.join(dir, 'en.json');
    fs.writeFileSync(
      file,
      '{"__proto__": {"polluted": "yes"}, "hello": "Hello", "a": {"__proto__": {"polluted": "yes"}, "b": "B"}}',
    );

    const result = getCurrentTranslation({ path: file, fileFormat: 'json' });

    expect(result).toEqual({ hello: 'Hello', a: { b: 'B' } });
    expect(Object.hasOwn(result, '__proto__')).toBe(false);
    expect(Object.hasOwn(result['a'] as object, '__proto__')).toBe(false);
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(file));
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('__proto__'));
  });

  it(`GIVEN a json file without a __proto__ key
      WHEN the translation is read
      THEN it is returned untouched and nothing is logged`, () => {
    const file = path.join(dir, 'en.json');
    fs.writeFileSync(file, '{"hello": "Hello", "a": {"b": "B"}}');

    expect(getCurrentTranslation({ path: file, fileFormat: 'json' })).toEqual({
      hello: 'Hello',
      a: { b: 'B' },
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it(`GIVEN a pot file with a __proto__ entry
      WHEN the translation is read
      THEN the entry is dropped, the rest is kept and one warning names the file`, () => {
    const file = path.join(dir, 'en.pot');
    fs.writeFileSync(
      file,
      [
        'msgid ""',
        'msgstr ""',
        '"Content-Type: text/plain; charset=UTF-8\\n"',
        '',
        'msgid "__proto__"',
        'msgstr "yes"',
        '',
        'msgid "hello"',
        'msgstr "Hello"',
        '',
      ].join('\n'),
    );

    const result = getCurrentTranslation({ path: file, fileFormat: 'pot' });

    expect(result).toEqual({ hello: 'Hello' });
    expect(Object.hasOwn(result, '__proto__')).toBe(false);
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(file));
  });
});
