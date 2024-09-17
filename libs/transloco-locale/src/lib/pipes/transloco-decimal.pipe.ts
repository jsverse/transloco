import { inject, Pipe, PipeTransform } from '@angular/core';
import { isNil } from '@jsverse/transloco';

import { getDefaultOptions } from '../shared';
import { TRANSLOCO_LOCALE_CONFIG } from '../transloco-locale.config';
import {
  Locale,
  LocaleConfig,
  NumberFormatOptions,
} from '../transloco-locale.types';

import { BaseLocalePipe } from './base-locale.pipe';

@Pipe({
  name: 'translocoDecimal',
  pure: false,
  standalone: true,
})
export class TranslocoDecimalPipe
  extends BaseLocalePipe
  implements PipeTransform
{
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);

  /**
   * Transform a given number into the locale's currency format.
   *
   * @example
   *
   * 1234567890 | translocoDecimal: {} : en-US // 1,234,567,890
   * 1234567890 | translocoDecimal: {useGrouping: false}: en-US // 1234567890
   *
   */
  transform(
    value: string | number,
    numberFormatOptions: NumberFormatOptions = {},
    locale?: Locale,
  ): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'decimal', this.localeConfig),
      ...numberFormatOptions,
    };

    return this.localeService.localizeNumber(value, 'decimal', locale, options);
  }
}
