import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil, HashMap } from '@ngneat/transloco';
import { localizeNumber } from '../helpers';
import { getDefaultOptions } from '../shared';
import { LOCALE_NUMBER_CONFIG, LOCALE_SETTINGS, LocaleSettings } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { NumberFormatOptions, Locale } from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

@Pipe({
  name: 'translocoDecimal',
  pure: false
})
export class TranslocoDecimalPipe extends TranslocoLocalePipe implements PipeTransform {
  constructor(
    protected translocoLocaleService: TranslocoLocaleService,
    protected cdr: ChangeDetectorRef,
    @Inject(LOCALE_NUMBER_CONFIG) private numberConfig: NumberFormatOptions,
    @Inject(LOCALE_SETTINGS) private localeSettings: HashMap<LocaleSettings>
  ) {
    super(translocoLocaleService, cdr);
  }

  /**
   * Transform a given number into the locale's currency format.
   *
   * @example
   *
   * 1234567890 | translocoDecimal: {} : en-US // 1,234,567,890
   * 1234567890 | translocoDecimal: {useGrouping: false}: en-US // 1234567890
   *
   */
  transform(value: string | number, digits: NumberFormatOptions = {}, locale?: Locale): string {
    if (isNil(value)) return '';
    locale = locale || this.translocoLocaleService.getLocale();
    const options = {
      style: 'decimal',
      ...digits
    };
    return localizeNumber(value, locale, {
      ...getDefaultOptions(locale, 'number', this.localeSettings, this.numberConfig),
      ...options
    });
  }
}
