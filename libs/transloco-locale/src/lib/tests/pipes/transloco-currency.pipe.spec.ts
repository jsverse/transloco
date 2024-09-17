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

  it('should transform number to currency', () => {
    spectator = pipeFactory(`{{ 123 | translocoCurrency }}`);
    expect(spectator.element).toHaveText('$123.00');
  });

  it('should transform string number to currency', () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency }}`);
    expect(spectator.element).toHaveText('$123.00');
  });

  it('should take the currency from the locale', () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency }}`, {
      providers: [provideTranslocoServiceMock('es-ES')],
    });
    expect(spectator.element).toContainText('€');
  });

  it('should take the currency given currency', () => {
    spectator = pipeFactory(
      `{{ '123' | translocoCurrency:'symbol':{}:'EUR' }}`,
    );
    expect(spectator.element).toContainText('€');
  });

  it('should format the currency given narrowSymbol as display argument', () => {
    spectator = pipeFactory(
      `{{ '123' | translocoCurrency:'narrowSymbol':{}:'CAD' }}`,
    );
    expect(spectator.element).toContainText('$');
  });

  it('should use given display', () => {
    spectator = pipeFactory(`{{ '123' | translocoCurrency:'code' }}`);
    const [, { currencyDisplay }] = getIntlCallArgs();
    expect(currencyDisplay).toEqual('code');
  });

  describe('None transformable values', () => {
    it('should handle null', () => {
      spectator = pipeFactory(`{{ null | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle {}', () => {
      spectator = pipeFactory(`{{ {} | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
    it('should handle none number string', () => {
      spectator = pipeFactory(`{{ 'none number string' | translocoCurrency }}`);
      expect(spectator.element).toHaveText('');
    });
  });

  describe('config options', () => {
    const defaultOptions = LOCALE_CONFIG_MOCK.global!.currency!;

    it('should use default config options', () => {
      spectator = pipeFactory(`{{ '123' | translocoCurrency }}`);
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toEqual(defaultOptions.useGrouping);
      expect(maximumFractionDigits).toEqual(
        defaultOptions.maximumFractionDigits,
      );
    });

    it('should use passed digit options instead of default options', () => {
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

    it('should take number options from locale settings', () => {
      spectator = pipeFactory(`{{ '123' | translocoCurrency }}`, {
        providers: [provideTranslocoServiceMock('es-ES')],
      });
      const [, { useGrouping, maximumFractionDigits }] = getIntlCallArgs();
      expect(useGrouping).toBeTruthy();
      expect(maximumFractionDigits).toEqual(3);
    });

    it('should take passed transform config options', () => {
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

    it('should fallback to default config when there are no settings for the current locale', () => {
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
