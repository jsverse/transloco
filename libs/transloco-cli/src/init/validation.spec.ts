import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  languageProblem,
  parseLanguages,
  translationsPathProblem,
} from './validation.js';

describe('languageProblem', () => {
  it.each(['en', 'es-MX', 'zh_Hans', 'pt.BR', 'x'])(
    `GIVEN the language %s
     WHEN it is checked
     THEN there is no problem`,
    (lang) => {
      expect(languageProblem(lang)).toBeUndefined();
    },
  );

  it.each([
    'en/es',
    'en\\es',
    '../en',
    '..',
    '.',
    'a b',
    'a\tb',
    'en:US',
    'en*',
    'a"b',
    'a|b',
  ])(
    `GIVEN the language %j
     WHEN it is checked
     THEN it can't be the name of a translation file`,
    (lang) => {
      expect(languageProblem(lang)).toContain('cannot be used as a language');
    },
  );

  it(`GIVEN an empty language
      WHEN it is checked
      THEN it can't be empty`, () => {
    expect(languageProblem('')).toBe('A language cannot be empty');
  });
});

describe('parseLanguages', () => {
  it.each([
    ['en es fr', ['en', 'es', 'fr']],
    ['en,es,fr', ['en', 'es', 'fr']],
    ['en, es,  fr', ['en', 'es', 'fr']],
    ['  en  ', ['en']],
    ['en en es en', ['en', 'es']],
    [',,', []],
    ['   ', []],
  ])(
    `GIVEN the answer %j
     WHEN the languages are read
     THEN they are %j`,
    (answer, langs) => {
      expect(parseLanguages(answer)).toEqual(langs);
    },
  );
});

describe('translationsPathProblem', () => {
  let dir: string;
  let outside: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-path-')),
    );
    outside = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-outside-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it.each([
    ['src/assets/i18n'],
    ['src/assets/i18n/'],
    ['./i18n'],
    ['.'],
    ['a/../b'],
  ])(
    `GIVEN the path %s that is inside the working directory
     WHEN it is checked
     THEN there is no problem`,
    (value) => {
      expect(translationsPathProblem(value, dir)).toBeUndefined();
    },
  );

  it(`GIVEN an absolute path inside the working directory
      WHEN it is checked
      THEN there is no problem`, () => {
    expect(
      translationsPathProblem(path.join(dir, 'i18n'), dir),
    ).toBeUndefined();
  });

  it.each([[''], ['   ']])(
    `GIVEN the blank path %j
     WHEN it is checked
     THEN it can't be empty`,
    (value) => {
      expect(translationsPathProblem(value, dir)).toBe(
        'The translations path cannot be empty',
      );
    },
  );

  it.each([['..'], ['../i18n'], ['src/../../i18n']])(
    `GIVEN the path %s that escapes with ..
     WHEN it is checked
     THEN it must be inside the current directory`,
    (value) => {
      expect(translationsPathProblem(value, dir)).toContain(
        'must be inside the current directory',
      );
    },
  );

  it(`GIVEN an absolute path outside the working directory
      WHEN it is checked
      THEN it must be inside the current directory`, () => {
    expect(translationsPathProblem(outside, dir)).toContain(
      'must be inside the current directory',
    );
  });

  it(`GIVEN a link inside the working directory that leads outside
      WHEN a path below it is checked
      THEN it must be inside the current directory, as the real path counts`, () => {
    fs.symlinkSync(outside, path.join(dir, 'link'));

    expect(translationsPathProblem('link/i18n', dir)).toContain(
      'must be inside the current directory',
    );
  });

  it(`GIVEN a link that leads to nowhere
      WHEN it is checked
      THEN its real location can't be resolved`, () => {
    fs.symlinkSync(path.join(dir, 'missing'), path.join(dir, 'broken'));

    expect(translationsPathProblem('broken/i18n', dir)).toContain(
      'cannot be resolved',
    );
  });

  it(`GIVEN a path that lies inside a file
      WHEN it is checked
      THEN a file is in the way`, () => {
    fs.writeFileSync(path.join(dir, 'file'), '');

    expect(translationsPathProblem('file/i18n', dir)).toContain('a file');
    expect(translationsPathProblem('file', dir)).toContain('a file');
  });
});
