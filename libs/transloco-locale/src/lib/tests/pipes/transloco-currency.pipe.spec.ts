import { SpectatorPipe } from '@ngneat/spectator';

import { TranslocoCurrencyPipe } from '../../pipes/transloco-currency.pipe';
import { LOCALE_CONFIG_MOCK, provideTranslocoServiceMock } from '../mocks';
import { NumberFormatOptions } from '../../transloco-locale.types';
import { createLocalePipeFactory } from '../utils';

describe('TranslocoCurrencyPipe', () => {
  let intlSpy: jasmine.Spy<(typeof Intl)['NumberFormat']>;
  let spectator: SpectatorPipe<TranslocoCurrencyPipe>;
  const pipeFactory = createLocalePipeFactory(TranslocoCurrencyPipe, {
    localeConfig: LOCALE_CONFIG_MOCK,
  });

  function getIntlCallArgs() {
    const [locale, options] = intlSpy.calls.argsFor(0);

    return [locale!, options!] as const;
  }

  beforeEach(() => {
    intlSpy = spyOn(Intl, 'NumberFormat').and.callThrough();
  });

  it(`GIVEN a number value
      WHEN transforming to currency
      THEN it should format as currency with symbol`, () => {
    spectator = pipeFactory(`{{ 123 | translocoCurrency }}`);
    expect(spectator.element).toHaveText('$123.00');
  });

  it(`GIVEN a string number value
      WHEN transforming to currency
      THEN it should format as currency with symbol`, () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency }}`);
    expect(spectator.element).toHaveText('$123.00');
  });

  it(`GIVEN es-ES locale
      WHEN transforming to currency
      THEN it should use the locale's currency symbol`, () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toContainText('€');
  });

  it(`GIVEN EUR as currency parameter
      WHEN transforming to currency
      THEN it should use the specified currency symbol`, () => {
    spectator = pipeFactory(
      `{{ '123' | translocoCurrency:'symbol':{}:'EUR' }}`,
    );
    expect(spectator.element).toContainText('€');
  });

  it(`GIVEN narrowSymbol as display argument and CAD currency
      WHEN transforming to currency
      THEN it should format with narrow symbol`, () => {
    spectator = pipeFactory(
      `{{ '123' | translocoCurrency:'narrowSymbol':{}:'CAD' }}`,
    );
    expect(spectator.element).toContainText('$');
  });

  it(`GIVEN code as display parameter
      WHEN transforming to currency
      THEN it should use code display format`, () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency:'code' }}`);
    const [, { currencyDisplay }] = getIntlCallArgs();
    expect(currencyDisplay).toEqual('code');
  });

  describe('None transformable values', () => {
    it(`GIVEN null value
        WHEN transforming to currency
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ null | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN empty object
        WHEN transforming to currency
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ {} | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
    it(`GIVEN non-numeric string
        WHEN transforming to currency
        THEN it should return empty string`, () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  describe('config options', () => {
    const defaultOptions = LOCALE_CONFIG_MOCK.global!.currency!;

    it(`GIVEN no custom config
        WHEN transforming to currency
        THEN it should use default config options`, () => {
      spectator = pipeFactory(`{{ '123' | translocoCurrency }}`);
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toEqual(defaultOptions.useGrouping);
      expect(maximumFractionDigits).toEqual(
        defaultOptions.maximumFractionDigits,
      );
    });

    it(`GIVEN custom digit options
        WHEN transforming to currency
        THEN it should use passed options instead of defaults`, () => {
      const config: NumberFormatOptions = {
        useGrouping: true,
        maximumFractionDigits: 4,
      };
      spectator = pipeFactory(
        `{{ '123' | translocoCurrency:'symbol':config }}`,
        {
          hostProps: {
            config,
          },
        },
      );
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toBeTruthy();
      expect(maximumFractionDigits).toEqual(4);
    });

    it(`GIVEN es-ES locale with locale-specific settings
        WHEN transforming to currency
        THEN it should use number options from locale settings`, () => {
      spectator = pipeFactory(`{{ '123' | translocoCurrency }}`, {
        providers: [provideTranslocoServiceMock('es-ES')],
      });
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toBeTruthy();
      expect(maximumFractionDigits).toEqual(3);
    });

    it(`GIVEN custom config and es-ES locale
        WHEN transforming to currency
        THEN it should use passed config over locale settings`, () => {
      const config = { useGrouping: false, maximumFractionDigits: 4 };
      spectator = pipeFactory(
        `{{ '123' | translocoCurrency:'symbol':config }}`,
        {
          providers: [provideTranslocoServiceMock('es-ES')],
          hostProps: {
            config,
          },
        },
      );
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toBeFalsy();
      expect(maximumFractionDigits).toEqual(4);
    });

    it(`GIVEN en-US locale with no specific settings
        WHEN transforming to currency
        THEN it should fallback to default config`, () => {
      spectator = pipeFactory(
        `{{ '123' | translocoCurrency:'symbol':config }}`,
        { providers: [provideTranslocoServiceMock('en-US')] },
      );
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toEqual(defaultOptions.useGrouping);
      expect(maximumFractionDigits).toEqual(
        defaultOptions.maximumFractionDigits,
      );
    });
  });
});
