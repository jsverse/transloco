import { InjectionToken } from '@angular/core';
import LOCALE_CURRENCY from './locale-currency';
import { NumberFormatOptions, TranslocoLocaleConfig, LocaleConfigMapping, LangToLocaleMapping, LocaleToCurrencyMapping } from './transloco-locale.types';

export const defaultConfig: Required<TranslocoLocaleConfig> = {
  localeConfig: {
    global: {},
    localeBased: {}
  },
  defaultLocale: 'en-US',
  defaultCurrency: 'USD',
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: {}
};

export const LOCALE_DEFAULT_LOCALE = new InjectionToken<NumberFormatOptions>('DEFAULT_LOCALE');
export const LOCALE_DEFAULT_CURRENCY = new InjectionToken<NumberFormatOptions>('DEFAULT_LOCALE_CURRENCY');
export const LOCALE_LANG_MAPPING = new InjectionToken<LangToLocaleMapping>('LOCALE_LANG_MAPPING');
export const LOCALE_CONFIG = new InjectionToken<LocaleConfigMapping>('LOCALE_CONFIG');
export const LOCALE_CURRENCY_MAPPING = new InjectionToken<LocaleToCurrencyMapping>('LOCALE_CURRENCY_MAPPING');
