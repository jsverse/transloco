import { of } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { mockProvider } from '@ngneat/spectator';

import LOCALE_CURRENCY from '../locale-currency';
import { Locale, LocaleConfig } from '../transloco-locale.types';
import { TRANSLOCO_LOCALE_CONFIG } from '../transloco-locale.config';

export const LOCALE_CURRENCY_MOCK = LOCALE_CURRENCY;
export const LANG_LOCALE_MOCK = { en: 'en-US', es: 'es-ES' };
export const DEFAULT_LOCALE_MOCK = 'en-US';
export const DEFAULT_CURRENCY_MOCK = 'USD';
export const LOCALE_CONFIG_MOCK: LocaleConfig = {
  global: {
    decimal: {
      useGrouping: false,
      maximumFractionDigits: 2,
    },
    percent: {
      useGrouping: false,
      maximumFractionDigits: 2,
    },
    currency: {
      useGrouping: false,
      maximumFractionDigits: 2,
    },
    date: {
      dateStyle: 'medium',
      timeStyle: 'medium',
    },
  },
  localeBased: {
    'es-ES': {
      decimal: {
        useGrouping: true,
        maximumFractionDigits: 3,
      },
      percent: {
        useGrouping: true,
        maximumFractionDigits: 3,
      },
      currency: {
        useGrouping: true,
        maximumFractionDigits: 3,
      },
      date: {
        dateStyle: 'long',
        timeStyle: 'long',
      },
    },
  },
};

export function provideTranslocoServiceMock(locale?: Locale) {
  return mockProvider(TranslocoService, {
    langChanges$: locale ? of(locale) : of(),
  });
}

export function provideTranslocoLocaleConfigMock(config: LocaleConfig) {
  return {
    provide: TRANSLOCO_LOCALE_CONFIG,
    useValue: config,
  };
}
