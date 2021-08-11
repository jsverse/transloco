import { InjectionToken } from '@angular/core';
import { localizeNumber, localizeDate } from './helpers';
import { Locale, DateFormatOptions, NumberTypes } from './transloco-locale.types';

export interface TranslocoDateTransformer {
  transform(date: Date, locale: Locale, options: DateFormatOptions): string;
}
export interface TranslocoNumberTransformer {
  transform(value: number | string, type: NumberTypes, locale: Locale, options: Intl.NumberFormatOptions): string;
}

export const TRANSLOCO_DATE_TRANSFORMER = new InjectionToken<TranslocoDateTransformer>('TRANSLOCO_DATE_TRANSFORMER');
export const TRANSLOCO_NUMBER_TRANSFORMER = new InjectionToken<TranslocoNumberTransformer>(
  'TRANSLOCO_NUMBER_TRANSFORMER'
);


export class DefaultDateTransformer implements TranslocoDateTransformer {
  public transform(date: Date, locale: Locale, options: DateFormatOptions): string {
    return localizeDate(date, locale, options);
  }
}
export class DefaultNumberTransformer implements TranslocoNumberTransformer {
  public transform(
    value: number | string,
    type: NumberTypes,
    locale: string,
    options: Intl.NumberFormatOptions
  ): string {
    return localizeNumber(value, locale, { ...options, style: type });
  }
}
