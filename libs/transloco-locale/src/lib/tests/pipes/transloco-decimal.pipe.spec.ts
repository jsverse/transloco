import { SpectatorPipe } from '@ngneat/spectator/vitest';
import type { MockInstance } from 'vitest';

import { TranslocoDecimalPipe } from '../../pipes';
import {
  LOCALE_CONFIG_MOCK,
  provideTranslocoLocaleConfigMock,
  provideTranslocoServiceMock,
} from '../mocks';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoDecimalPipe', () => {
  let intlSpy: MockInstance;
  let spectator: SpectatorPipe<TranslocoDecimalPipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoDecimalPipe);

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
      WHEN transforming to decimal
      THEN it should format with locale grouping`, () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`);
    expect(spectator.element).toHaveText('123,456');
  });

  it(`GIVEN a string number value
      WHEN transforming to decimal
      THEN it should format with locale grouping`, () => {
    spectator = pipeFactory(`{{ '123456' | translocoDecimal }}`);
    expect(spectator.element).toHaveText('123,456');
  });

  it(`GIVEN es-ES locale
      WHEN transforming to decimal
      THEN it should use locale-specific format`, () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toHaveText('123.456');
  });

  it(`GIVEN es-ES locale parameter
      WHEN transforming to decimal
      THEN it should use specified locale format`, () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal:{}:'es-ES' }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toHaveText('123.456');
  });

  it(`GIVEN global config with default options
      WHEN transforming to decimal
      THEN it should use default config options`, () => {
    spectator = pipeFactory(`{{ 123456 | translocoDecimal }}`, {
      providers: [provideTranslocoLocaleConfigMock(LOCALE_CONFIG_MOCK)],
    });
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toEqual(false);
    expect(maximumFractionDigits).toEqual(2);
  });

  it(`GIVEN custom digit options
      WHEN transforming to decimal
      THEN it should use passed options instead of defaults`, () => {
    spectator = pipeFactory(
      `{{ 123456 | translocoDecimal:{ useGrouping: true, maximumFractionDigits: 3 } }}`,
    );
    const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
    expect(useGrouping).toEqual(true);
    expect(maximumFractionDigits).toEqual(3);
  });

  describe('None transformable values', () => {
    it(`GIVEN null value
        WHEN transforming to decimal
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ null | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN empty object
        WHEN transforming to decimal
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ {} | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN non-numeric string
        WHEN transforming to decimal
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoDecimal }}`);
      expect(spectator.element).toHaveText('');
    });
  });
});
