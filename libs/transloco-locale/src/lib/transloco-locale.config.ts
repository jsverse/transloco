import { InjectionToken } from '@angular/core';

import LOCALE_CURRENCY from './locale-currency';
import {
  TranslocoLocaleConfig,
  LocaleConfigMapping,
  LangToLocaleMapping,
  LocaleToCurrencyMapping,
  Locale,
  Currency,
} from './transloco-locale.types';

export const defaultConfig: Required<TranslocoLocaleConfig> = {
  localeConfig: {
    global: {},
    localeBased: {},
  },
  defaultLocale: 'en-US',
  defaultCurrency: 'USD',
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: {},
};

export const TRANSLOCO_LOCALE_DEFAULT_LOCALE = new InjectionToken<Locale>(
  'TRANSLOCO_LOCALE_DEFAULT_LOCALE',
);
export const TRANSLOCO_LOCALE_DEFAULT_CURRENCY = new InjectionToken<Currency>(
  'TRANSLOCO_LOCALE_DEFAULT_CURRENCY',
);
export const TRANSLOCO_LOCALE_LANG_MAPPING =
  new InjectionToken<LangToLocaleMapping>('TRANSLOCO_LOCALE_LANG_MAPPING');
export const TRANSLOCO_LOCALE_CONFIG = new InjectionToken<LocaleConfigMapping>(
  'TRANSLOCO_LOCALE_CONFIG',
);
export const TRANSLOCO_LOCALE_CURRENCY_MAPPING =
  new InjectionToken<LocaleToCurrencyMapping>(
    'TRANSLOCO_LOCALE_CURRENCY_MAPPING',
  );
