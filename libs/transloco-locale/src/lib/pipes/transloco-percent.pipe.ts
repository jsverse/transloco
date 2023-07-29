import { inject, Pipe, PipeTransform } from '@angular/core';
import { isNil } from '@ngneat/transloco';

import { getDefaultOptions } from '../shared';
import { TRANSLOCO_LOCALE_CONFIG } from '../transloco-locale.config';
import {
  Locale,
  LocaleConfig,
  NumberFormatOptions,
} from '../transloco-locale.types';

import { BaseLocalePipe } from './base-locale.pipe';

@Pipe({
  name: 'translocoPercent',
  pure: false,
  standalone: true,
})
export class TranslocoPercentPipe
  extends BaseLocalePipe
  implements PipeTransform
{
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);

  /**
   * Transform a given number into the locale's currency format.
   *
   * @example
   *
   * 1 | translocoPercent : {} : en-US // 100%
   * "1" | translocoPercent : {} : en-US // 100%
   *
   */
  transform(
    value: number | string,
    numberFormatOptions: NumberFormatOptions = {},
    locale?: Locale
  ): string {
    if (isNil(value)) return '';
    locale = this.getLocale(locale);

    const options = {
      ...getDefaultOptions(locale, 'percent', this.localeConfig),
      ...numberFormatOptions,
    };

    return this.localeService.localizeNumber(value, 'percent', locale, options);
  }
}
