import { Pipe, ChangeDetectorRef, PipeTransform, Inject } from '@angular/core';
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
   * @example
   *
   * date | translocoDate
   * date | translocoDate: {dateStyle: 'long'}
   * date | translocoDate: {dateStyle: 'full'}
   *
   */
  transform(value: Date, options: DateFormatOptions = {}, locale?) {
    // TODO: take the currency code only if it's the first time just like in the directive.
    locale = locale || this.translocoLocaleService.getLocale();
    return value.toLocaleDateString(locale, { ...this.dateConfig, ...options });
  }
}
