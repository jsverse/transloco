import { of } from 'rxjs';
import LOCALE_CURRENCY from '../locale-currency';
import { Locale } from '../transloco-locale.types';
import createSpy = jasmine.createSpy;
import { LocaleConfig } from '../../lib/transloco-locale.config';

export function createFakeService(locale: Locale = 'en-US') {
  return {
    getLocale: createSpy().and.callFake(() => locale),
    localeChanges$: of(locale)
  };
}

export function createFakeCDR(locale: string = 'en-US') {
  return {
    markForCheck: createSpy()
  };
}

export const LOCALE_CURRENCY_MOCK = LOCALE_CURRENCY;
export const LANG_LOCALE_MOCK = { en: 'en-US', es: 'es-ES' };
export const DEFAULT_LOCALE_MOCK = 'en-US';
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
