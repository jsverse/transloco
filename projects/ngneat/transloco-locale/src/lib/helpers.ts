import NumberFormatOptions = Intl.NumberFormatOptions;
import { toNumber } from '@ngneat/transloco';

/**
 * check if a given value is in BCP 47 language tag.
 *
 * isLocaleFormat('en') // false,
 * isLocaleFormat('En-us') // false
 * isLocaleFormat('en-US') // true
 */
export function isLocaleFormat(val) {
  return val.match(/[a-z]{2}-[A-Z]{2}/);
}

export function localizeNumber(value: number | string, locale, options: NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(toNumber(value));
}
