import { InjectionToken } from '@angular/core';
import { HashMap } from '@ngneat/transloco';
import LOCALE_CURRENCY from './locale-currency';
import { DateFormatOptions, NumberFormatOptions, Locale, Currency } from './transloco-locale.types';

export interface LocaleFormatOptions {
  date?: DateFormatOptions;
  decimal?: NumberFormatOptions;
  currency?: NumberFormatOptions;
  percent?: NumberFormatOptions;
}

export interface LocaleConfig {
  global?: LocaleFormatOptions;
  localeBased?: HashMap<LocaleFormatOptions>;
}

export interface TranslocoLocaleConfig {
  defaultLocale?: Locale;
  defaultCurrency?: Currency;
  localeConfig?: LocaleConfig;
  langToLocaleMapping?: HashMap<Locale>;
  localeToCurrencyMapping?: HashMap<Currency>;
  langToLocaleMappingEnabled?: boolean;
}

export const defaultConfig: TranslocoLocaleConfig = {
  localeConfig: {
    global: {},
    localeBased: {}
  },
  defaultLocale: 'en-US',
  defaultCurrency: 'USD',
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: {},
  langToLocaleMappingEnabled: true
};

export const LOCALE_DEFAULT_LOCALE = new InjectionToken<NumberFormatOptions>('DEFAULT_LOCALE');
export const LOCALE_DEFAULT_CURRENCY = new InjectionToken<NumberFormatOptions>('DEFAULT_LOCALE_CURRENCY');
export const LOCALE_LANG_MAPPING = new InjectionToken<HashMap<Locale>>('LOCALE_LANG_MAPPING');
export const LOCALE_CONFIG = new InjectionToken<HashMap<LocaleFormatOptions>>('LOCALE_CONFIG');
export const LOCALE_CURRENCY_MAPPING = new InjectionToken<HashMap<Currency>>('LOCALE_CURRENCY_MAPPING');
export const LOCALE_ENABLE_LANG_MAPPING = new InjectionToken<boolean>('LOCALE_ENABLE_LANG_MAPPING');
