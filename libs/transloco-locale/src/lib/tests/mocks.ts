import { of } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { ChangeDetectorRef } from '@angular/core';
import { Mock } from 'ts-mocks';

import LOCALE_CURRENCY from '../locale-currency';
import {
  DefaultDateTransformer,
  DefaultNumberTransformer,
} from '../transloco-locale.transformers';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { Locale, LocaleConfig } from '../transloco-locale.types';

export function mockLocaleService(locale: Locale = 'en-US') {
  return mockService(mockTranslocoService(locale), locale);
}

export function mockCDR() {
  return new Mock<ChangeDetectorRef>({
    markForCheck: () => {},
  }).Object;
}

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

export const mockTranslocoService = (locale?: Locale): TranslocoService =>
  ({
    langChanges$: locale ? of(locale) : of(),
  } as any);
export const mockService = (
  translocoService = mockTranslocoService(),
  locale = DEFAULT_LOCALE_MOCK,
  currency = DEFAULT_CURRENCY_MOCK,
  langLocale = LANG_LOCALE_MOCK,
  config = LOCALE_CONFIG_MOCK,
  localeCurrencyMapping = LOCALE_CURRENCY_MOCK,
  numberTransformer = new DefaultNumberTransformer(),
  dateTransformer = new DefaultDateTransformer()
) =>
  new TranslocoLocaleService(
    translocoService,
    langLocale,
    locale,
    currency,
    config,
    localeCurrencyMapping,
    numberTransformer,
    dateTransformer
  );
