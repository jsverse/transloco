import { InjectionToken } from '@angular/core';
import { HashMap } from '@ngneat/transloco';
import { DateFormatOptions, NumberFormatOptions, Locale, Currency } from './transloco-locale.types';
import LOCALE_CURRENCY from './locale-currency.json';
import LANG_LOCALE from './lang-locale.json';

export interface TranslocoLocaleConfig {
  number: NumberFormatOptions;
  date: DateFormatOptions;
  langToLocaleMapping: HashMap<Locale>;
  localeToCurrencyMapping: HashMap<Currency>;
}

export const defaultConfig: TranslocoLocaleConfig = {
  number: {},
  date: {},
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: LANG_LOCALE
};

export const LOCALE_NUMBER_CONFIG = new InjectionToken<NumberFormatOptions>('LOCALE_NUMBER_CONFIG');
export const LOCALE_DATE_CONFIG = new InjectionToken<DateFormatOptions>('LOCALE_DATE_CONFIG');
export const LOCALE_LANG_MAPPING = new InjectionToken<HashMap<Locale>>('LOCALE_LANG_MAPPING');
export const LOCALE_CURRENCY_MAPPING = new InjectionToken<HashMap<Currency>>('LOCALE_CURRENCY_MAPPING');
