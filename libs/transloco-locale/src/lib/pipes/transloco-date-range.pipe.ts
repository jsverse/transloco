import { inject, Pipe, PipeTransform } from '@angular/core';
import { isNil } from '@jsverse/transloco';

import { toDate } from "../helpers";
import { getDefaultOptions } from "../shared";
import { TRANSLOCO_LOCALE_CONFIG } from "../transloco-locale.config";
import { Locale, DateFormatOptions, LocaleConfig, ValidDate } from "../transloco-locale.types";
import { BaseLocalePipe } from "./base-locale.pipe";

@Pipe({
  name: 'translocoDateRange',
  pure: false,
  standalone: true,
})
export class TranslocoDateRangePipe
  extends BaseLocalePipe
  implements PipeTransform {
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);

  /**
   * Transform two dates into the locale's date range format.
   *
   * The date expression: a `Date` object,  a number
   * (milliseconds since UTC epoch), or an ISO string (https://www.w3.org/TR/NOTE-datetime).
   *
   * @example
   *
   * startDate | translocoDateRange: endDate : {} : en-US // 9/10–10/10/2019
   * startDate | translocoDate: endDate : { dateStyle: 'medium', timeStyle: 'medium' } : en-US // Sep 10, 2019, 10:46:12 PM – Oct 10, 2019, 10:46:12 PM
   * '2019-02-08' | translocoDate: '2020-03-10' : { dateStyle: 'medium' } // Feb 8 2019 – Mar 10 2020
   */
  transform(
    startDate: ValidDate,
    endDate: ValidDate,
    options: DateFormatOptions = {},
    locale?: Locale,
  ) {
    if (isNil(startDate)) return '';
    if (isNil(endDate)) {
      // @TODO Fallback to TranslocoDatePipe;
      return ''
    };
    locale = this.getLocale(locale);

    return this.localeService.localizeDateRange(startDate, endDate, locale, {
      ...getDefaultOptions(locale, 'date', this.localeConfig),
      ...options,
    });
  }
}
