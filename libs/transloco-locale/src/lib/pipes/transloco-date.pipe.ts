import {
  Pipe,
  ChangeDetectorRef,
  PipeTransform,
  Inject,
  OnDestroy,
} from '@angular/core';
import { isNil } from '@ngneat/transloco';
import { getDefaultOptions } from '../shared';
import { LOCALE_CONFIG } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import {
  DateFormatOptions,
  Locale,
  ValidDate,
  LocaleConfig,
} from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

@Pipe({
  name: 'translocoDate',
  pure: false,
})
export class TranslocoDatePipe
  extends TranslocoLocalePipe
  implements PipeTransform, OnDestroy
{
  constructor(
    protected translocoLocaleService: TranslocoLocaleService,
    protected cdr: ChangeDetectorRef,
    @Inject(LOCALE_CONFIG) private localeConfig: LocaleConfig
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
   * 1 | translocoDate: { dateStyle: 'medium' } // Jan 1, 1970
   * '2019-02-08' | translocoDate: { dateStyle: 'medium' } // Feb 8, 2019
   */
  transform(date: ValidDate, options: DateFormatOptions = {}, locale?: Locale) {
    if (isNil(date)) return '';
    locale = this.getLocale(locale);

    return this.translocoLocaleService.localizeDate(date, locale, {
      ...getDefaultOptions(locale, 'date', this.localeConfig),
      ...options,
    });
  }

  ngOnDestroy(): void {
    super.onDestroy();
  }
}
