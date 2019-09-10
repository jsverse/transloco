import { Pipe, PipeTransform, ChangeDetectorRef, Inject } from '@angular/core';
import { isNil } from '@ngneat/transloco';
import { localizeNumber } from '../helpers';
import { LOCALE_NUMBER_CONFIG } from '../transloco-locale.config';
import { TranslocoLocaleService } from '../transloco-locale.service';
import { NumberFormatOptions } from '../transloco-locale.types';
import LOCAL_CURRENCY from './../locale-currency.json';
import { TranslocoLocalePipe } from './transloco-locale.pipe';

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
   * 1000000 | translocoCurrency: 'symbol' : {} : USD // $1,000,000.00
   * 1000000 | translocoCurrency: 'name' : {} : USD // 1,000,000.00 US dollars
   * 1000000 | translocoCurrency: 'symbol' : {minimumFractionDigits: 0 } : USD // $1,000,000
   *
   */
  transform(
    value: number | string,
    display: 'code' | 'symbol' | 'name' = 'symbol',
    digits: NumberFormatOptions = {},
    currencyCode?: string
  ): string {
    if (isNil(value)) return '';
    const options = {
      ...digits,
      currencyDisplay: display,
      style: 'currency',
      currency: currencyCode || this.getCurrencyCode(this.translocoLocaleService.getLocale())
    };
    return localizeNumber(value, this.translocoLocaleService.getLocale(), {
      ...this.numberConfig,
      ...options
    });
  }

  private getCurrencyCode(locale: string) {
    return LOCAL_CURRENCY[locale] || 'USD';
  }
}
