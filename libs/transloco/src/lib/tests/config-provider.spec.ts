import {
  provideTranslocoConfig,
  defaultConfig,
  TRANSLOCO_CONFIG,
  TranslocoConfig,
} from '../transloco.config';

describe('provideTranslocoConfig', () => {
  it('should return the expected provider with default config given no input', () => {
    // arrange
    const expected = {
      provide: TRANSLOCO_CONFIG,
      useValue: defaultConfig,
    };

    // act
    const actual = provideTranslocoConfig();

    // assert
    expect(actual).toEqual(expected);
  });

  it('should return the expected provider with config given', () => {
    // arrange
    const inputConfig: TranslocoConfig = {
      ...defaultConfig,
      defaultLang: 'es',
    };

    const expected = {
      provide: TRANSLOCO_CONFIG,
      useValue: inputConfig,
    };

    // act
    const actual = provideTranslocoConfig(inputConfig);

    // assert
    expect(actual).toEqual(expected);
  });
});
