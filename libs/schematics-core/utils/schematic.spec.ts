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
