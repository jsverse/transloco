import NumberFormatOptions = Intl.NumberFormatOptions;
import { toNumber } from '@ngneat/transloco';

export const ISO8601_DATE_REGEX = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
/**
 * check if a given value is in BCP 47 language tag.
 *
 * isLocaleFormat('en') // false,
 * isLocaleFormat('En-us') // false
 * isLocaleFormat('en-US') // true
 */
export function isLocaleFormat(val: string): boolean {
  return typeof val === 'string' && !!val.match(/[a-z]{2}-[A-Z]{2}/);
}

export function localizeNumber(value: number | string, locale, options: NumberFormatOptions): string {
  const number = toNumber(value);
  return number !== null ? new Intl.NumberFormat(locale, options).format(number) : '';
}

export function isDate(value): boolean {
  return value instanceof Date && !isNaN(<any>value);
}

export function toDate(value): Date {
  let match: RegExpMatchArray | null;

  if (typeof value === 'string') {
    value = value.trim();
  }
  if (isDate(value)) {
    return value;
  } else if (!isNaN(value - parseFloat(value))) {
    return new Date(parseFloat(value));
  } else if (typeof value === 'string' && /^(\d{4}-\d{1,2}-\d{1,2})$/.test(value)) {
    const [y, m, d] = value.split('-').map((val: string) => parseInt(val, 10));
    return new Date(y, m - 1, d);
  } else if (typeof value === 'string' && (match = value.match(ISO8601_DATE_REGEX))) {
    return isoStringToDate(match);
  } else {
    return new Date(value);
  }
}

export function isoStringToDate(match: RegExpMatchArray): Date {
  const date: Date = new Date(0);
  let tzHour: number = 0;
  let tzMin: number = 0;
  const dateSetter: Function = match[8] ? date.setUTCFullYear : date.setFullYear;
  const timeSetter: Function = match[8] ? date.setUTCHours : date.setHours;
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
