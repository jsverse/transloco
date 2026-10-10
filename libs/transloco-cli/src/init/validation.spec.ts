import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  languageProblem,
  parseLanguages,
  translationsPathProblem,
  writeProblem,
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

  it.each([['src'], ['src/assets'], ['src/assets/i18n']])(
    `GIVEN the file %s on the way to the path src/assets/i18n
     WHEN it is checked
     THEN a file is in the way, whatever the level`,
    (file) => {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), '');

      expect(translationsPathProblem('src/assets/i18n', dir)).toBe(
        'The translations path src/assets/i18n is, or lies inside, a file',
      );
    },
  );
});

describe('writeProblem', () => {
  // Nothing stops a user that can write anywhere
  const asRoot = process.getuid?.() === 0;
  let dir: string;
  const locked: string[] = [];

  /** Takes the right to write away, which `afterEach` gives back. */
  function lock(target: string) {
    locked.push(target);
    fs.chmodSync(target, fs.statSync(target).isDirectory() ? 0o555 : 0o444);
  }

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'transloco-cli-init-write-')),
    );
  });

  afterEach(() => {
    for (const target of locked.splice(0)) {
      fs.chmodSync(target, fs.statSync(target).isDirectory() ? 0o755 : 0o644);
    }

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it(`GIVEN a file that does not exist in a folder that does
      WHEN it is checked
      THEN it can be written`, () => {
    expect(writeProblem('transloco.config.ts', dir)).toBeUndefined();
  });

  it(`GIVEN a file whose folders do not exist yet
      WHEN it is checked
      THEN it can be written, as the folders can be made`, () => {
    expect(writeProblem('src/assets/i18n/en.json', dir)).toBeUndefined();
  });

  it(`GIVEN a file that exists and is writable
      WHEN it is checked
      THEN it can be written`, () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');

    expect(writeProblem('package.json', dir)).toBeUndefined();
  });

  it.skipIf(asRoot)(
    `GIVEN a file that exists and is read-only
     WHEN it is checked
     THEN it is read-only`,
    () => {
      fs.writeFileSync(path.join(dir, 'package.json'), '{}');
      lock(path.join(dir, 'package.json'));

      expect(writeProblem('package.json', dir)).toBe('it is read-only');
    },
  );

  it.skipIf(asRoot)(
    `GIVEN a file that does not exist in a read-only folder
     WHEN it is checked
     THEN the folder is read-only`,
    () => {
      fs.mkdirSync(path.join(dir, 'src/assets/i18n'), { recursive: true });
      lock(path.join(dir, 'src/assets/i18n'));

      expect(writeProblem('src/assets/i18n/en.json', dir)).toBe(
        `the folder ${path.join('src', 'assets', 'i18n')} is read-only`,
      );
    },
  );

  it.skipIf(asRoot)(
    `GIVEN a file whose folders are missing below a read-only folder
     WHEN it is checked
     THEN the deepest folder that exists is the one that is read-only`,
    () => {
      fs.mkdirSync(path.join(dir, 'src'));
      lock(path.join(dir, 'src'));

      expect(writeProblem('src/assets/i18n/en.json', dir)).toBe(
        'the folder src is read-only',
      );
    },
  );

  it.skipIf(asRoot)(
    `GIVEN a file in the working directory that is read-only
     WHEN it is checked
     THEN the working directory is named as .`,
    () => {
      lock(dir);

      expect(writeProblem('transloco.config.ts', dir)).toBe(
        'the folder . is read-only',
      );
    },
  );

  it.each([['src'], ['src/assets']])(
    `GIVEN the file %s on the way to a file
     WHEN it is checked
     THEN that file is named as the one in the way`,
    (file) => {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), '');

      expect(writeProblem('src/assets/i18n/en.json', dir)).toBe(
        `${file.replaceAll('/', path.sep)} is a file`,
      );
    },
  );

  it(`GIVEN a folder where the file should be
      WHEN it is checked
      THEN it is a folder`, () => {
    fs.mkdirSync(path.join(dir, 'transloco.config.ts'));

    expect(writeProblem('transloco.config.ts', dir)).toBe('it is a folder');
  });

  it(`GIVEN a link to nowhere where the file should be
      WHEN it is checked
      THEN it is a link that leads nowhere`, () => {
    fs.symlinkSync(
      path.join(dir, 'missing'),
      path.join(dir, 'transloco.config.ts'),
    );

    expect(writeProblem('transloco.config.ts', dir)).toBe(
      'it is a link that leads nowhere',
    );
  });

  it(`GIVEN a link to a file where the file should be
      WHEN it is checked
      THEN it can be written, as the write goes through the link`, () => {
    fs.writeFileSync(path.join(dir, 'real.json'), '{}');
    fs.symlinkSync(path.join(dir, 'real.json'), path.join(dir, 'package.json'));

    expect(writeProblem('package.json', dir)).toBeUndefined();
  });
});
