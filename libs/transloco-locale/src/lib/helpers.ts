import { toNumber } from '@jsverse/utils';

import { DateFormatOptions, Locale } from './transloco-locale.types';

export const ISO8601_DATE_REGEX =
  /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;

/**
 * Checks if a given value is a valid BCP 47 language tag.
 *
 * Validation is delegated to `Intl.getCanonicalLocales`, which means all
 * formats accepted by the platform are accepted here — including single
 * subtags, case-insensitive region codes, and script subtags. This is
 * intentionally more permissive than a hand-rolled regex so
 * that values coming directly from `navigator.language` (e.g. `"de"` on
 * Firefox or `"de-de"` on Safari) are treated as valid.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is a valid BCP 47 language tag, `false` otherwise.
 *
 * @example
 * // Single primary language subtag (e.g. Firefox)
 * isLocaleFormat('de') // true
 *
 * @example
 * // Standard language-REGION tag
 * isLocaleFormat('en-US') // true
 *
 * @example
 * // Case-insensitive region (e.g. Safari)
 * isLocaleFormat('de-de') // true
 *
 * @example
 * // Script subtag
 * isLocaleFormat('zh-Hant-TW') // true
 *
 * @example
 * // Invalid tag
 * isLocaleFormat('not valid') // false
 * isLocaleFormat('') // false
 * isLocaleFormat(null) // false
 */
export function isLocaleFormat(value: any): value is Locale {
  try {
    return (
      typeof value === 'string' && Intl.getCanonicalLocales(value).length > 0
    );
  } catch {
    return false;
  }
}

export function localizeNumber(
  value: number | string,
  locale: Locale,
  options: Intl.NumberFormatOptions,
): string {
  const number = toNumber(value);
  return number !== null
    ? new Intl.NumberFormat(locale, options).format(number)
    : '';
}

export function localizeDate(
  date: Date,
  locale: Locale,
  options: DateFormatOptions,
): string {
  if (isDate(date)) {
    return new Intl.DateTimeFormat(locale, options as any).format(date);
  }
  return '';
}

export function isDate(value: any): boolean {
  return value instanceof Date && !isNaN(<any>value);
}

export function toDate(value: any): Date {
  let match: RegExpMatchArray | null;

  if (typeof value === 'string') {
    value = value.trim();
  }

  if (isDate(value)) {
    return value;
  }

  if (!isNaN(value - parseFloat(value))) {
    return new Date(parseFloat(value));
  }

  if (typeof value === 'string' && /^(\d{4}-\d{1,2}-\d{1,2})$/.test(value)) {
    const [y, m, d] = value.split('-').map((val: string) => parseInt(val, 10));
    return new Date(y, m - 1, d);
  }

  if (typeof value === 'string' && (match = value.match(ISO8601_DATE_REGEX))) {
    return isoStringToDate(match);
  }

  return new Date(value);
}

export function isoStringToDate(match: RegExpMatchArray): Date {
  const date: Date = new Date(0);
  let tzHour = 0;
  let tzMin = 0;
  const dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear;
  const timeSetter = match[8] ? date.setUTCHours : date.setHours;
  if (match[9]) {
    tzHour = +(match[9] + match[10]);
    tzMin = +(match[9] + match[11]);
  }
  dateSetter.call(date, +match[1], +match[2] - 1, +match[3]);
  const h: number = +(match[4] || '0') - tzHour;
  const m: number = +(match[5] || '0') - tzMin;
  const s: number = +(match[6] || '0');
  const ms: number = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
  timeSetter.call(date, h, m, s, ms);
  return date;
}
