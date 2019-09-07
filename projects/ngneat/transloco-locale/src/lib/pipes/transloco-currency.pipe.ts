import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { localizeNumber, isLocaleFormat } from '../helpers';
import { LOCALE_DATE_CONFIG, LOCALE_NUMBER_CONFIG } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { NumberFormatOptions, DateFormatOptions } from '../transloco-locale.types';
import { TranslocoLocalePipe } from './transloco-locale.pipe';
import LOCAL_CURRENCY from './../locale-currency.json';

@Pipe({
  name: 'translocoCurrency',
  pure: false
})
export class TranslocoCurrencyPipe extends TranslocoLocalePipe implements PipeTransform {
  constructor(
    protected translocoLocaleService: TranslocoLocaleService,
    protected cdr: ChangeDetectorRef,
    @Inject(LOCALE_NUMBER_CONFIG) private numberConfig: NumberFormatOptions
  ) {
    super(translocoLocaleService, cdr);
  }

  /**
   * Transform a given number into the locale's currency format.
   *
   * @example
   *
   * 1000000 | translocoCurrency
   * 1000000 | translocoCurrency: 'name'
   * 1000000 | translocoCurrency: 'symbol' : {minimumFractionDigits: 0}
   *
   */
  transform(
    value: number | string,
    display: 'code' | 'symbol' | 'name' = 'symbol',
    digits: NumberFormatOptions = {},
    currencyCode?: string
  ): string {
    const options = {
      ...digits,
      currencyDisplay: display,
      style: 'currency',
      // TODO: consider adding "static" parameter that will define override behaviour.
      currency: currencyCode || this.getCurrencyCode(this.translocoLocaleService.getLocale())
    };
    return localizeNumber(value, this.translocoLocaleService.getLocale(), {
      ...this.numberConfig,
      ...options
    });
  }

  private getCurrencyCode(locale: string) {
    console.log(LOCAL_CURRENCY[locale]);
    return LOCAL_CURRENCY[locale] || 'USD';
  }
}
