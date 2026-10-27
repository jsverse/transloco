import { generateConfigFile } from './schematic';

describe('generateConfigFile', () => {
  it('should write every language when there are more than 100', () => {
    // given
    const langs = Array.from({ length: 101 }, (_, i) => `l${i + 1}`);

    // when
    const file = generateConfigFile({
      rootTranslationsPath: 'src/assets/i18n',
      langs,
      keysManager: {},
    });

    // then
    expect(file).not.toContain('more item');
    expect(file).toContain("'l101'");
  });
});

describe('generateConfigFile format', () => {
  it('should write the file the way Prettier leaves it, ending with a line break', () => {
    // when
    const file = generateConfigFile({
      rootTranslationsPath: 'public/i18n/',
      langs: ['en', 'es'],
      keysManager: {},
    });

    // then
    expect(file)
      .toBe(`import type { TranslocoGlobalConfig } from '@jsverse/transloco';

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'public/i18n/',
  langs: ['en', 'es'],
  keysManager: {},
};

export default config;
`);
  });

  it('should put each language on its own line when they pass 80 columns', () => {
    // given
    const langs = Array.from({ length: 30 }, (_, i) => `l${i + 1}`);

    // when
    const file = generateConfigFile({
      rootTranslationsPath: 'public/i18n/',
      langs,
      keysManager: {},
    });

    // then
    expect(file).toContain("  langs: [\n    'l1',\n    'l2',");
    expect(file).toContain("    'l30',\n  ],\n");
  });

  it('should escape quotes and backslashes', () => {
    // when
    const file = generateConfigFile({
      rootTranslationsPath: "it's\\x",
      langs: [],
      keysManager: {},
    });

    // then
    expect(file).toContain("rootTranslationsPath: 'it\\'s\\\\x',");
    expect(file).toContain('langs: [],');
  });

  it('should escape line breaks and other control characters', () => {
    // when
    const file = generateConfigFile({
      rootTranslationsPath: 'a\nb\r\tc\u2028d\u0001',
      langs: [],
      keysManager: {},
    });

    // then
    expect(file).toContain(
      "rootTranslationsPath: 'a\\nb\\r\\tc\\u2028d\\u0001',",
    );
  });
});
