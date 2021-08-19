import { TranslocoCurrencyPipe } from '../../pipes/transloco-currency.pipe';
import { defaultConfig } from '../../transloco-locale.config';
import { mockLocaleService, mockCDR, LOCALE_CONFIG_MOCK } from '../mocks';
import {ChangeDetectorRef} from "@angular/core";
import {TranslocoLocaleService} from '../../transloco-locale.service';
import {LocaleConfig} from '../../transloco-locale.types';

describe('TranslocoCurrencyPipe', () => {
  let service: TranslocoLocaleService;
  let cdr: ChangeDetectorRef;
  let pipe: TranslocoCurrencyPipe;

  beforeEach(() => {
    service = mockLocaleService();
    cdr = mockCDR();
    pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig.localeConfig);
  });

  it('should transform number to currency', () => {
    expect(pipe.transform(123)).toEqual('$123.00');
    expect(pipe.transform('123')).toEqual('$123.00');
  });

  it('should take the currency from the locale', () => {
    service = mockLocaleService('es-ES');
    pipe = new TranslocoCurrencyPipe(service, cdr, defaultConfig.localeConfig);
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
    expect(pipe.transform(null as any)).toEqual('');
    expect(pipe.transform({} as any)).toEqual('');
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
      const pipe = new TranslocoCurrencyPipe(service, cdr, config);
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
      service = mockLocaleService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK);
      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should take passed transform config options', () => {
      service = mockLocaleService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK);

      const config = { useGrouping: false, maximumFractionDigits: 3 };
      pipe.transform('123', undefined, config);

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should override default config with the locale config', () => {
      service = mockLocaleService('es-ES');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK);
      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeTruthy();
      expect(call[1].maximumFractionDigits).toEqual(3);
    });

    it('should fallback to default config when there are no settings for the current locale', () => {
      service = mockLocaleService('en-US');

      pipe = new TranslocoCurrencyPipe(service, cdr, LOCALE_CONFIG_MOCK);

      pipe.transform('123');

      const call = (Intl.NumberFormat as any).calls.argsFor(0);

      expect(call[1].useGrouping).toBeFalsy();
      expect(call[1].maximumFractionDigits).toEqual(2);
    });
  });
});
