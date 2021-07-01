import { of } from 'rxjs';
import { TranslocoService } from '../../../../transloco/src/lib/transloco.service';
import LOCALE_CURRENCY from '../locale-currency';
import { DefaultDateTransformer, DefaultNumberTransformer } from '../transloco-locale.transformers';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { Locale } from '../transloco-locale.types';
import createSpy = jasmine.createSpy;
import { LocaleConfig } from '../../lib/transloco-locale.config';

export function createFakeService(locale: Locale = 'en-US') {
  return mockService({ translocoService: mockTranslocoService(locale), locale });
}

export function createFakeCDR(locale: string = 'en-US') {
  return {
    markForCheck: createSpy()
  };
}

export const LOCALE_CURRENCY_MOCK = LOCALE_CURRENCY;
export const LANG_LOCALE_MOCK = { en: 'en-US', es: 'es-ES' };
export const DEFAULT_LOCALE_MOCK = 'en-US';
export const DEFAULT_CURRENCY_MOCK = 'USD';
export const LOCALE_ENABLE_LANG_MAPPING_MOCK = true;
export const LOCALE_CONFIG_MOCK: LocaleConfig = {
  global: {
    decimal: {
      useGrouping: false,
      maximumFractionDigits: 2
    },
    percent: {
      useGrouping: false,
      maximumFractionDigits: 2
    },
    currency: {
      useGrouping: false,
      maximumFractionDigits: 2
    },
    date: {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }
  },
  localeBased: {
    'es-ES': {
      decimal: {
        useGrouping: true,
        maximumFractionDigits: 3
      },
      percent: {
        useGrouping: true,
        maximumFractionDigits: 3
      },
      currency: {
        useGrouping: true,
        maximumFractionDigits: 3
      },
      date: {
        dateStyle: 'long',
        timeStyle: 'long'
      }
    }
  }
};

export const mockTranslocoService = (locale?: Locale): TranslocoService =>
  ({
    langChanges$: locale ? of(locale) : of()
  } as any);

const defaultMockConf = {
  translocoService: mockTranslocoService(),
  locale: DEFAULT_LOCALE_MOCK,
  currency: DEFAULT_CURRENCY_MOCK,
  langLocale: LANG_LOCALE_MOCK,
  config: LOCALE_CONFIG_MOCK,
  localeCurrencyMapping: LOCALE_CURRENCY_MOCK,
  numberTransformer: new DefaultNumberTransformer(),
  dateTransformer: new DefaultDateTransformer(),
  langToLocaleMappingEnabled: LOCALE_ENABLE_LANG_MAPPING_MOCK
};

export const mockService = (mockConf?: Partial<typeof defaultMockConf>): TranslocoLocaleService => {
  const conf = Object.assign({}, defaultMockConf, mockConf);

  return new TranslocoLocaleService(
    conf.translocoService,
    conf.langLocale,
    conf.locale,
    conf.currency,
    conf.config,
    conf.localeCurrencyMapping,
    conf.numberTransformer,
    conf.dateTransformer,
    conf.langToLocaleMappingEnabled
  );
};
