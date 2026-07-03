import { SpectatorPipe } from '@ngneat/spectator/vitest';
import type { MockInstance } from 'vitest';

import { TranslocoPercentPipe } from '../../pipes';
import { LOCALE_CONFIG_MOCK, provideTranslocoLocaleConfigMock } from '../mocks';
import { createLocalePipeFactory, pipeTplFactory } from '../utils';

describe('TranslocoPercentPipe', () => {
  let intlSpy: MockInstance;
  let spectator: SpectatorPipe<TranslocoPercentPipe>;
  const getPipeTpl = pipeTplFactory('translocoPercent');
  const pipeFactory = createLocalePipeFactory(TranslocoPercentPipe);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.mock.calls[0];

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    // vi.spyOn calls through for plain methods, but not when the spied target
    // is used as a constructor (`new Intl.NumberFormat(...)`). Reconstruct the
    // original so `.format(...)` still works while recording the ctor args.
    const OriginalNumberFormat = Intl.NumberFormat;
    intlSpy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (
      ...args: ConstructorParameters<typeof Intl.NumberFormat>
    ) {
      return new OriginalNumberFormat(...args);
    });
  });

  it(`GIVEN a number value
      WHEN transforming to percent
      THEN it should format as percentage`, () => {
    spectator = pipeFactory(getPipeTpl(1));
    expect(spectator.element).toHaveText('100%');
  });

  it(`GIVEN a string number value
      WHEN transforming to percent
      THEN it should format as percentage`, () => {
    spectator = pipeFactory(getPipeTpl('1'));
    expect(spectator.element).toHaveText('100%');
  });

  describe('None transformable values', () => {
    it(`GIVEN null value
        WHEN transforming to percent
        THEN it should return empty string`, () => {
      spectator = pipeFactory(getPipeTpl(null));
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN empty object
        WHEN transforming to percent
        THEN it should return empty string`, () => {
      spectator = pipeFactory(getPipeTpl({}));
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN non-numeric string
        WHEN transforming to percent
        THEN it should return empty string`, () => {
      spectator = pipeFactory(getPipeTpl('none number string'));
      expect(spectator.element).toHaveText('');
    });
  });

  it(`GIVEN global config with default options
      WHEN transforming to percent
      THEN it should use default config options`, () => {
    spectator = pipeFactory(getPipeTpl('1'), {
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBe(false);
    expect(maximumFractionDigits).toEqual(2);
  });

  it(`GIVEN custom digit options
      WHEN transforming to percent
      THEN it should use passed options instead of defaults`, () => {
    spectator = pipeFactory(
      getPipeTpl('1', '{ useGrouping: true, maximumFractionDigits: 3 }'),
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toBe(true);
    expect(maximumFractionDigits).toEqual(3);
  });
});
