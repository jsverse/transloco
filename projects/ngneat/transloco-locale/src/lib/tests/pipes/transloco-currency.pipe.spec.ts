import { defaultConfig, LocaleConfig } from '../../transloco-locale.config';
import { TranslocoCurrencyPipe } from '../../pipes/transloco-currency.pipe';
import { createFakeService, createFakeCDR, LOCALE_CURRENCY_MOCK, LOCALE_CONFIG_MOCK } from '../mocks';

describe('TranslocoCurrencyPipe', () => {
  let service;
  let cdr;
  let pipe: TranslocoCurrencyPipe;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig.localeConfig, LOCALE_CURRENCY_MOCK);
  });

  it('should transform number to currency', () => {
    expect(pipe.transform(123)).toEqual('$123.00');
    expect(pipe.transform('123')).toEqual('$123.00');
  });

  it('should take the currency from the locale', () => {
    service = createFakeService('es-ES');
    pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig.localeConfig, LOCALE_CURRENCY_MOCK);
    expect(pipe.transform('123')).toContain('€');
  });

  it('should take the currency given currency', () => {
    expect(pipe.transform('123', undefined, undefined, 'EUR')).toContain('€');
  });

  it('should use given display', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    pipe.transform('123', 'code');
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].currencyDisplay).toEqual('code');
  });

  it('should handle none transformable values', () => {
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none number string')).toEqual('');
  });

  describe('config options', () => {
    beforeEach(() => {
      spyOn(Intl, 'NumberFormat').and.callThrough();
    });

    it('should use default config options', () => {
      const config: LocaleConfig = {
        global: { currency: { useGrouping: true, maximumFractionDigits: 2 } },
        localeBased: {}
      };
      const pipe = new TranslocoCurrencyPipe(service, cdr, config, LOCALE_CURRENCY_MOCK);
      pipe.transform('123');
      const call = (Intl.NumberFormat as any).calls.argsFor(0);
      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(2);
    });

    it('should use passed digit options instead of default options', () => {
      const config = { useGrouping: true, maximumFractionDigits: 3 };
      pipe.transform('123', undefined, config);
      const call = (Intl.NumberFormat as any).calls.argsFor(0);
      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should take number options from locale settings', () => {
      service = createFakeService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK, LOCALE_CURRENCY_MOCK);
      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should take passed transform config options', () => {
      service = createFakeService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK, LOCALE_CURRENCY_MOCK);

      const config = { useGrouping: false, maximumFractionDigits: 3 };
      pipe.transform('123', undefined, config);

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should override default config with the locale config', () => {
      service = createFakeService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK, LOCALE_CURRENCY_MOCK);
      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should fallback to default config when there are no settings for the current locale', () => {
      service = createFakeService('en-US');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK, LOCALE_CURRENCY_MOCK);

      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(2);
    });
  });
});
