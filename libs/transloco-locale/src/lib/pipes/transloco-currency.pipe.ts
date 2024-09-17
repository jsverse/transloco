import { inject, Pipe, PipeTransform } from '@angular/core';
import { isNil } from '@jsverse/transloco';

import { getDefaultOptions } from '../shared';
import { TRANSLOCO_LOCALE_CONFIG } from '../transloco-locale.config';
import {
  Currency,
  Locale,
  LocaleConfig,
  NumberFormatOptions,
} from '../transloco-locale.types';

import { BaseLocalePipe } from './base-locale.pipe';

@Pipe({
  name: 'translocoCurrency',
  pure: false,
  standalone: true,
})
export class TranslocoCurrencyPipe
  extends BaseLocalePipe
  implements PipeTransform
{
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);

  /**
   * Transform a given number into the locale's currency format.
   *
   * @example
   *
   * 1000000 | translocoCurrency: 'symbol' : {} : USD // $1,000,000.00
   * 1000000 | translocoCurrency: 'name' : {} : USD // 1,000,000.00 US dollars
   * 1000000 | translocoCurrency: 'symbol' : {minimumFractionDigits: 0 } : USD // $1,000,000
   * 1000000 | translocoCurrency: 'symbol' : {minimumFractionDigits: 0 } : CAD // CA$1,000,000
   * 1000000 | translocoCurrency: 'narrowSymbol' : {minimumFractionDigits: 0 } : CAD // $1,000,000
   *
   */
  transform(
    value: number | string,
    display: 'code' | 'symbol' | 'narrowSymbol' | 'name' = 'symbol',
    numberFormatOptions: NumberFormatOptions = {},
    currencyCode?: Currency,
    locale?: Locale,
  ): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'currency', this.localeConfig),
      ...numberFormatOptions,
      currencyDisplay: display,
      currency: currencyCode || this.localeService._resolveCurrencyCode(),
    };

    return this.localeService.localizeNumber(
      value,
      'currency',
      locale,
      options,
    );
  }
}
