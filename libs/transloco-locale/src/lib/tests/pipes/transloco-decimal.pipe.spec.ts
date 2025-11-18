import { SpectatorPipe } from '@ngneat/spectator';

import { TranslocoDecimalPipe } from '../../pipes';
import {
  LOCALE_CONFIG_MOCK,
  provideTranslocoLocaleConfigMock,
  provideTranslocoServiceMock,
} from '../mocks';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoDecimalPipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['NumberFormat']>;
  let spectator: SpectatorPipe<TranslocoDecimalPipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoDecimalPipe);

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'NumberFormat').and.callThrough();
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
