import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil } from '@ngneat/transloco';
import { getDefaultOptions } from '../shared';
import { LOCALE_CONFIG, LocaleConfig } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { NumberFormatOptions, Locale } from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

@Pipe({
  name: 'translocoPercent',
  pure: false
})
export class TranslocoPercentPipe extends TranslocoLocalePipe implements PipeTransform {
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
   * 1 | translocoPercent : {} : en-US // 100%
   * "1" | translocoPercent : {} : en-US // 100%
   *
   */
  transform(value: number | string, numberFormatOptions: NumberFormatOptions = {}, locale?: Locale): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'percent', this.localeConfig),
      ...numberFormatOptions
    };
    return this.translocoLocaleService.localizeNumber(value, 'percent', locale, options);
  }
}
