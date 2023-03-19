import { inject, Pipe, PipeTransform } from '@angular/core';
import { isNil } from '@ngneat/transloco';

import { isDate } from '../helpers';
import { getDefaultOptions } from '../shared';
import { TRANSLOCO_LOCALE_CONFIG } from '../transloco-locale.config';
import {
  DateFormatOptions,
  Locale,
  LocaleConfig,
  ValidDate,
} from '../transloco-locale.types';

import { BaseLocalePipe } from './base-locale.pipe';

@Pipe({
  name: 'translocoDate',
  pure: false,
  standalone: true,
})
export class TranslocoDatePipe
  extends BaseLocalePipe<ValidDate, [options?: DateFormatOptions, locale?: Locale]>
  implements PipeTransform {
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);

  /**
   * Transform a date into the locale's date format.
   *
   * The date expression: a `Date` object,  a number
   * (milliseconds since UTC epoch), or an ISO string (https://www.w3.org/TR/NOTE-datetime).
   *
   * @example
   *
   * date | translocoDate: {} : en-US // 9/10/2019
   * date | translocoDate: { dateStyle: 'medium', timeStyle: 'medium' } : en-US // Sep 10, 2019, 10:46:12 PM
   * date | translocoDate: { timeZone: 'UTC', timeStyle: 'full' } : en-US // 7:40:32 PM Coordinated Universal Time
   * 1 | translocoDate: { dateStyle: 'medium' } // Jan 1, 1970
   * '2019-02-08' | translocoDate: { dateStyle: 'medium' } // Feb 8, 2019
   */
  protected override doTransform(date: ValidDate, options: DateFormatOptions = {}, locale?: Locale) {
    if (isNil(date)) return '';
    locale = this.getLocale(locale);

    return this.localeService.localizeDate(date, locale, {
      ...getDefaultOptions(locale, 'date', this.localeConfig),
      ...options,
    });
  } 

  protected override isSameValue(value?: ValidDate) {
    return this.getComparableDate(this.lastValue) === this.getComparableDate(value);
  }

  private getComparableDate(value?: any) {
    return isDate(value) ? value.getTime() : value;
  }
}
