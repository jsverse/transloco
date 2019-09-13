import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil, HashMap } from '@ngneat/transloco';
import { localizeNumber } from '../helpers';
import LOCALE_CURRENCY from '../locale-currency.json';
import { getDefaultOptions } from '../shared';
import {
  LOCALE_NUMBER_CONFIG,
  LOCALE_CURRENCY_MAPPING,
  LOCALE_SETTINGS,
  LocaleSettings
} from '../transloco-locale.config';
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
    @Inject(LOCALE_NUMBER_CONFIG) private numberConfig: NumberFormatOptions,
    @Inject(LOCALE_CURRENCY_MAPPING) private localeCurrencyMapping: HashMap<Currency>,
    @Inject(LOCALE_SETTINGS) private localeSettings: HashMap<LocaleSettings>
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
    digits: NumberFormatOptions = {},
    currencyCode?: Currency,
    locale?: Locale
  ): string {
    if (isNil(value)) return '';

    locale = locale || this.translocoLocaleService.getLocale();

    const options = {
      ...digits,
      currencyDisplay: display,
      style: 'currency',
      currency: currencyCode || this.getCurrencyCode(this.translocoLocaleService.getLocale())
    };
    return localizeNumber(value, locale, {
      ...getDefaultOptions(locale, 'number', this.localeSettings, this.numberConfig),
      ...options
    });
  }

  private getCurrencyCode(locale: Locale) {
    return this.localeCurrencyMapping[locale] || 'USD';
  }
}
