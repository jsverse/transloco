import { TranslocoCurrencyPipe } from '../../pipes/transloco-currency.pipe';
import { createFakeService, createFakeCDR, LOCALE_CURRENCY_MOCK, SETTINGS_MOCK } from '../mocks';

describe('TranslocoCurrencyPipe', () => {
  let service;
  let cdr;
  let pipe: TranslocoCurrencyPipe;

  beforeEach(() => {
    service = createFakeService();
    cdr = createFakeCDR();
    pipe = new TranslocoCurrencyPipe(service, cdr, {}, LOCALE_CURRENCY_MOCK, {});
  });

  it('Should transform number to currency', () => {
    expect(pipe.transform(123)).toEqual('$123.00');
    expect(pipe.transform('123')).toEqual('$123.00');
  });

  it('Should take the currency from the locale', () => {
    service = createFakeService('es-ES');
    pipe = new TranslocoCurrencyPipe(service, cdr, {}, LOCALE_CURRENCY_MOCK, {});
    expect(pipe.transform('123')).toContain('€');
  });

  it('Should take the currency given currency', () => {
    expect(pipe.transform('123', undefined, undefined, 'EUR')).toContain('€');
  });

  it('Should use given display', () => {
    spyOn(Intl, 'NumberFormat').and.callThrough();
    pipe.transform('123', 'code');
    const call = (Intl.NumberFormat as any).calls.argsFor(0);
    expect(call[1].currencyDisplay).toEqual('code');
  });

  it('Should handle none transformable values', () => {
    expect(pipe.transform(null)).toEqual('');
    expect(pipe.transform(<any>{})).toEqual('');
    expect(pipe.transform('none number string')).toEqual('');
  });

  describe('config options', () => {
    beforeEach(() => {
      spyOn(Intl, 'NumberFormat').and.callThrough();
    });

    it('Should use default config options', () => {
      const config = { useGrouping: true, maximumFractionDigits: 2 };
      const pipe = new TranslocoCurrencyPipe(service, cdr, config, LOCALE_CURRENCY_MOCK, {});
      pipe.transform('123');
      const call = (Intl.NumberFormat as any).calls.argsFor(0);
      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(2);
    });

    it('Should use passed digit options instead of default options', () => {
      const config = { useGrouping: true, maximumFractionDigits: 3 };
      pipe.transform('123', undefined, config);
      const call = (Intl.NumberFormat as any).calls.argsFor(0);
      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('Should take number options from locale settings', () => {
      service = createFakeService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, {}, LOCALE_CURRENCY_MOCK, SETTINGS_MOCK);
      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('Should take passed transform config options', () => {
      service = createFakeService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, {}, LOCALE_CURRENCY_MOCK, SETTINGS_MOCK);

      const config = { useGrouping: false, maximumFractionDigits: 3 };
      pipe.transform('123', undefined, config);

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('Should override default config with the locale config', () => {
      service = createFakeService('es-ES');

      const defaultConfig = { useGrouping: false, maximumFractionDigits: 3 };
      pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig, LOCALE_CURRENCY_MOCK, SETTINGS_MOCK);

      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('Should fallback to default config when there are no settings for the current locale', () => {
      service = createFakeService('en-US');

      const defaultConfig = { useGrouping: false, maximumFractionDigits: 5 };
      pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig, LOCALE_CURRENCY_MOCK, SETTINGS_MOCK);

      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(5);
    });
  });
});
