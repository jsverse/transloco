import { Pipe, ChangeDetectorRef, PipeTransform, Inject } from '@angular/core';
import { isNil } from '@ngneat/transloco';
import { isDate, toDate } from '../helpers';
import { LOCALE_DATE_CONFIG } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { DateFormatOptions } from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

@Pipe({
  name: 'translocoDate',
  pure: false
})
export class TranslocoDatePipe extends TranslocoLocalePipe implements PipeTransform {
  constructor(
    protected translocoLocaleService: TranslocoLocaleService,
    protected cdr: ChangeDetectorRef,
    @Inject(LOCALE_DATE_CONFIG) private dateConfig: DateFormatOptions
  ) {
    super(translocoLocaleService, cdr);
  }

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
   * 1 | translocoDate: { dateStyle: 'medium', timeStyle: 'medium' }
   */
  transform(value: Date | string | number, options: DateFormatOptions = {}, locale?) {
    if (isNil(value)) return '';
    locale = locale || this.translocoLocaleService.getLocale();
    value = toDate(value);
    if (isDate(value)) {
      return value.toLocaleDateString(locale, { ...this.dateConfig, ...options });
    }
    return '';
  }
}
