import { describe, expect, it } from 'vitest';

import { CliError } from '../errors.js';

import {
  generateConfigFile,
  type InitAnswers,
  type InitState,
  planInit,
  translationFile,
} from './plan.js';

const answers = (overrides: Partial<InitAnswers> = {}): InitAnswers => ({
  langs: ['en'],
  translationsPath: 'src/assets/i18n',
  createTranslationFiles: true,
  addScripts: true,
  ...overrides,
});

const state = (existing: string[] = [], manifest?: string): InitState => ({
  exists: (file) => existing.includes(file),
  manifest,
});

const manifest = (scripts?: Record<string, string>) =>
  JSON.stringify({ name: 'app', ...(scripts && { scripts }) }, null, 2) + '\n';

/** Every step as `message` or `message => file`, which is how a plan reads best. */
const summarize = (steps: ReturnType<typeof planInit>) =>
  steps.map(({ message, write }) =>
    write ? `${message} => ${write.file}` : message,
  );

describe('generateConfigFile', () => {
  // The text `ng add @jsverse/transloco` generates for the same input, taken
  // from running its generator
  it(`GIVEN one language
      WHEN the config file is generated
      THEN it is the text ng add generates, with no line break at its end`, () => {
    expect(
      generateConfigFile({
        rootTranslationsPath: 'src/assets/i18n',
        langs: ['en'],
        keysManager: {},
      }),
    ).toBe(
      "import type { TranslocoGlobalConfig } from '@jsverse/transloco';\n\nconst config: TranslocoGlobalConfig = {\n  rootTranslationsPath: 'src/assets/i18n',\n  langs: [ 'en' ],\n  keysManager: {}\n};\n\nexport default config;",
    );
  });

  it(`GIVEN several languages and a longer path
      WHEN the config file is generated
      THEN it is the text ng add generates`, () => {
    expect(
      generateConfigFile({
        rootTranslationsPath: 'projects/shop/src/assets/i18n',
        langs: ['en', 'es', 'fr', 'de'],
        keysManager: {},
      }),
    ).toBe(
      "import type { TranslocoGlobalConfig } from '@jsverse/transloco';\n\nconst config: TranslocoGlobalConfig = {\n  rootTranslationsPath: 'projects/shop/src/assets/i18n',\n  langs: [ 'en', 'es', 'fr', 'de' ],\n  keysManager: {}\n};\n\nexport default config;",
    );
  });
});

describe('translationFile', () => {
  it.each([
    ['src/assets/i18n', 'src/assets/i18n/en.json'],
    ['src/assets/i18n/', 'src/assets/i18n/en.json'],
    ['src\\assets\\i18n\\', 'src\\assets\\i18n/en.json'],
    ['.', './en.json'],
  ])(
    `GIVEN the folder %s
     WHEN the file of a language is named
     THEN it is %s`,
    (folder, file) => {
      expect(translationFile(folder, 'en')).toBe(file);
    },
  );
});

describe('planInit', () => {
  it(`GIVEN the defaults and an empty folder
      WHEN init is planned
      THEN it creates the config and the file of the language`, () => {
    const steps = planInit(answers({ addScripts: false }), state());

    expect(summarize(steps)).toEqual([
      'Created transloco.config.ts => transloco.config.ts',
      'Created src/assets/i18n/en.json => src/assets/i18n/en.json',
    ]);
    expect(steps[0].write?.content).toBe(
      generateConfigFile({
        rootTranslationsPath: 'src/assets/i18n',
        langs: ['en'],
        keysManager: {},
      }),
    );
    expect(steps[1].write?.content).toBe('{}\n');
  });

  it(`GIVEN several languages and a path of their own
      WHEN init is planned
      THEN the config names them all and a file is created for each`, () => {
    const steps = planInit(
      answers({
        langs: ['en', 'es'],
        translationsPath: 'projects/ui/i18n/',
        addScripts: false,
      }),
      state(),
    );

    expect(summarize(steps)).toEqual([
      'Created transloco.config.ts => transloco.config.ts',
      'Created projects/ui/i18n/en.json => projects/ui/i18n/en.json',
      'Created projects/ui/i18n/es.json => projects/ui/i18n/es.json',
    ]);
    expect(steps[0].write?.content).toContain(
      `rootTranslationsPath: 'projects/ui/i18n/'`,
    );
    expect(steps[0].write?.content).toContain(`langs: [ 'en', 'es' ]`);
  });

  it(`GIVEN translation files that exist
      WHEN init is planned
      THEN they are kept and only the missing ones are created`, () => {
    const steps = planInit(
      answers({ langs: ['en', 'es', 'fr'], addScripts: false }),
      state(['src/assets/i18n/es.json']),
    );

    expect(summarize(steps)).toEqual([
      'Created transloco.config.ts => transloco.config.ts',
      'Created src/assets/i18n/en.json => src/assets/i18n/en.json',
      'Kept src/assets/i18n/es.json, it already exists',
      'Created src/assets/i18n/fr.json => src/assets/i18n/fr.json',
    ]);
  });

  it(`GIVEN the creation of the translation files is declined
      WHEN init is planned
      THEN only the config is written`, () => {
    const steps = planInit(
      answers({ createTranslationFiles: false, addScripts: false }),
      state(),
    );

    expect(summarize(steps)).toEqual([
      'Created transloco.config.ts => transloco.config.ts',
    ]);
  });

  it(`GIVEN a config that exists
      WHEN init is planned
      THEN the config is overwritten`, () => {
    const steps = planInit(
      answers({ createTranslationFiles: false, addScripts: false }),
      state(['transloco.config.ts']),
    );

    expect(summarize(steps)).toEqual([
      'Overwrote transloco.config.ts => transloco.config.ts',
    ]);
  });

  describe('the scripts', () => {
    it(`GIVEN a package.json without scripts
        WHEN init is planned
        THEN both scripts are added in one write`, () => {
      const steps = planInit(
        answers({ createTranslationFiles: false }),
        state([], manifest()),
      );

      expect(summarize(steps).slice(1)).toEqual([
        'Added the script i18n:extract to package.json => package.json',
        'Added the script i18n:find to package.json',
      ]);
      expect(JSON.parse(steps[1].write!.content).scripts).toEqual({
        'i18n:extract': 'transloco extract',
        'i18n:find': 'transloco find',
      });
    });

    it(`GIVEN a package.json with one of the scripts, set to something else
        WHEN init is planned
        THEN that one is kept as it is and the other one is added`, () => {
      const steps = planInit(
        answers({ createTranslationFiles: false }),
        state([], manifest({ 'i18n:extract': 'my-extract' })),
      );

      expect(summarize(steps).slice(1)).toEqual([
        'Kept the script i18n:extract, package.json already defines it',
        'Added the script i18n:find to package.json => package.json',
      ]);
      expect(JSON.parse(steps[2].write!.content).scripts).toEqual({
        'i18n:extract': 'my-extract',
        'i18n:find': 'transloco find',
      });
    });

    it(`GIVEN a package.json with both scripts
        WHEN init is planned
        THEN package.json is not written`, () => {
      const steps = planInit(
        answers({ createTranslationFiles: false }),
        state(
          [],
          manifest({ 'i18n:extract': 'a', 'i18n:find': 'transloco find' }),
        ),
      );

      expect(summarize(steps).slice(1)).toEqual([
        'Kept the script i18n:extract, package.json already defines it',
        'Kept the script i18n:find, package.json already defines it',
      ]);
      expect(steps.filter((step) => step.write)).toHaveLength(1);
    });

    it(`GIVEN no package.json
        WHEN init is planned
        THEN no script is mentioned`, () => {
      const steps = planInit(
        answers({ createTranslationFiles: false }),
        state(),
      );

      expect(summarize(steps)).toEqual([
        'Created transloco.config.ts => transloco.config.ts',
      ]);
    });

    it(`GIVEN scripts are declined and a package.json exists
        WHEN init is planned
        THEN package.json is left alone, even one that could not take them`, () => {
      const steps = planInit(
        answers({ createTranslationFiles: false, addScripts: false }),
        state([], '{ not json'),
      );

      expect(summarize(steps)).toEqual([
        'Created transloco.config.ts => transloco.config.ts',
      ]);
    });

    it.each([
      ['is no JSON', '{ not json'],
      ['holds an array', '[]'],
      ['has scripts that are no object', '{"scripts": "x"}'],
    ])(
      `GIVEN a package.json that %s
       WHEN init is planned
       THEN a CLI error is thrown`,
      (_, text) => {
        expect(() =>
          planInit(answers({ createTranslationFiles: false }), state([], text)),
        ).toThrow(CliError);
      },
    );

    it(`GIVEN a package.json with Windows line endings and four spaces
        WHEN init is planned
        THEN the scripts are added in that style`, () => {
      const text = '{\r\n    "name": "app"\r\n}\r\n';

      const steps = planInit(
        answers({ createTranslationFiles: false }),
        state([], text),
      );

      expect(steps[1].write?.content).toBe(
        '{\r\n    "name": "app",\r\n    "scripts": {\r\n        "i18n:extract": "transloco extract",\r\n        "i18n:find": "transloco find"\r\n    }\r\n}\r\n',
      );
    });
  });
});
