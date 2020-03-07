import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil, HashMap } from '@ngneat/transloco';
import { getDefaultOptions } from '../shared';
import { LOCALE_CURRENCY_MAPPING, LOCALE_CONFIG, LocaleConfig } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { NumberFormatOptions, Currency, Locale } from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

@Pipe({
  name: 'translocoCurrency',
  pure: false
})
export class TranslocoCurrencyPipe extends TranslocoLocalePipe implements PipeTransform {
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
   * 1000000 | translocoCurrency: 'symbol' : {} : USD // $1,000,000.00
   * 1000000 | translocoCurrency: 'name' : {} : USD // 1,000,000.00 US dollars
   * 1000000 | translocoCurrency: 'symbol' : {minimumFractionDigits: 0 } : USD // $1,000,000
   *
   */
  transform(
    value: number | string,
    display: 'code' | 'symbol' | 'name' = 'symbol',
    numberFormatOptions: NumberFormatOptions = {},
    currencyCode?: Currency,
    locale?: Locale
  ): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'currency', this.localeConfig),
      ...numberFormatOptions,
      currencyDisplay: display,
      currency: currencyCode || this.translocoLocaleService._resolveCurrencyCode()
    };
    return this.translocoLocaleService.localizeNumber(value, 'currency', locale, options);
  }
}
