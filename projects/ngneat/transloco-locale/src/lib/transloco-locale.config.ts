import { InjectionToken } from '@angular/core';
import { HashMap } from '@ngneat/transloco';
import { DateFormatOptions, NumberFormatOptions, Locale, Currency } from './transloco-locale.types';
import LOCALE_CURRENCY from './locale-currency.json';

export interface LocaleSettings {
  date?: DateFormatOptions;
  number?: NumberFormatOptions;
}

export interface TranslocoLocaleConfig {
  number?: NumberFormatOptions;
  date?: DateFormatOptions;
  defaultLocale?: Locale;
  localeSettings?: HashMap<LocaleSettings>;
  langToLocaleMapping?: HashMap<Locale>;
  localeToCurrencyMapping?: HashMap<Currency>;
}

export const defaultConfig: TranslocoLocaleConfig = {
  number: {},
  date: {},
  defaultLocale: 'en-US',
  localeSettings: {},
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: {}
};

export const LOCALE_DEFAULT_LOCALE = new InjectionToken<NumberFormatOptions>('DEFAULT_LOCALE');
export const LOCALE_NUMBER_CONFIG = new InjectionToken<NumberFormatOptions>('LOCALE_NUMBER_CONFIG');
export const LOCALE_DATE_CONFIG = new InjectionToken<DateFormatOptions>('LOCALE_DATE_CONFIG');
export const LOCALE_LANG_MAPPING = new InjectionToken<HashMap<Locale>>('LOCALE_LANG_MAPPING');
export const LOCALE_SETTINGS = new InjectionToken<HashMap<LocaleSettings>>('LOCALE_SETTINGS');
export const LOCALE_CURRENCY_MAPPING = new InjectionToken<HashMap<Currency>>('LOCALE_CURRENCY_MAPPING');
