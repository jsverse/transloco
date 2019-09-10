import { InjectionToken } from '@angular/core';
import { DateFormatOptions, NumberFormatOptions } from './transloco-locale.types';

export interface TranslocoLocaleConfig {
  number: NumberFormatOptions;
  date: DateFormatOptions;
}

export const LOCALE_NUMBER_CONFIG = new InjectionToken<NumberFormatOptions>('LOCALE_NUMBER_CONFIG');
export const LOCALE_DATE_CONFIG = new InjectionToken<DateFormatOptions>('LOCALE_DATE_CONFIG');
