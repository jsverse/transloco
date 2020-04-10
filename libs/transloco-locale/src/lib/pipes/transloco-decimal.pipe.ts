import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil } from '@ngneat/transloco';
import { getDefaultOptions } from '../shared';
import { LOCALE_CONFIG, LocaleConfig } from '../transloco-locale.config';
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
    @Inject(LOCALE_CONFIG) private localeConfig: LocaleConfig
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
  transform(value: string | number, numberFormatOptions: NumberFormatOptions = {}, locale?: Locale): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'decimal', this.localeConfig),
      ...numberFormatOptions
    };
    return this.translocoLocaleService.localizeNumber(value, 'decimal', locale, options);
  }
}
