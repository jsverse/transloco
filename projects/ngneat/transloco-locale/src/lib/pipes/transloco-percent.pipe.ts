import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil, HashMap } from '@ngneat/transloco';
import { localizeNumber } from '../helpers';
import { getDefaultOptions } from '../shared';
import { LOCALE_NUMBER_CONFIG, LOCALE_SETTINGS, LocaleSettings } from '../transloco-locale.config';
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
   * 1 | translocoPercent : {} : en-US // 100%
   * "1" | translocoPercent : {} : en-US // 100%
   *
   */
  transform(value: number | string, digits: NumberFormatOptions = {}, locale?: Locale): string {
    if (isNil(value)) return '';
    locale = locale || this.translocoLocaleService.getLocale();
    const options = {
      style: 'percent',
      ...digits
    };
    return localizeNumber(value, locale, {
      ...getDefaultOptions(locale, 'number', this.localeSettings, this.numberConfig),
      ...options
    });
  }
}
