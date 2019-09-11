export interface NumberFormatOptions {
  /**
   * Whether to use grouping separators, such as thousands separators or thousand/lakh/crore separators. Possible values are true and false; the default is true.
   */
  useGrouping?: Intl.NumberFormatOptions['useGrouping'];
  /**
   * The minimum number of integer digits to use. Possible values are from 1 to 21.
   */
  minimumIntegerDigits?: Intl.NumberFormatOptions['minimumIntegerDigits'];
  /**
   * The minimum number of fraction digits to use. Possible values are from 0 to 20.
   */
  minimumFractionDigits?: Intl.NumberFormatOptions['minimumFractionDigits'];
  /**
   * The maximum number of fraction digits to use. Possible values are from 0 to 20.
   */
  maximumFractionDigits?: Intl.NumberFormatOptions['maximumFractionDigits'];
  /**
   * The minimum number of significant digits to use. Possible values are from 1 to 21.
   */
  minimumSignificantDigits?: Intl.NumberFormatOptions['minimumSignificantDigits'];
  /**
   * The maximum number of significant digits to use. Possible values are from 1 to 21
   */
  maximumSignificantDigits?: number;
}

export interface DateFormatOptions {
  /**
   * The date formatting style.
   */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /**
   * The time formatting style.
   */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /**
   * The time zone to use. The only value implementations must recognize is "UTC"; the default is the runtime's default time zone. Implementations may also recognize the time zone names of the IANA time zone database, such as "Asia/Shanghai", "Asia/Kolkata", "America/New_York".
   */
  timeZone?: Intl.DateTimeFormatOptions['timeZone'];
}

//BCP 47 locale string (e.g. en-US, es-ES).
export type Locale = string;

//ISO 4217 currency string (e.g. USD, EUR).
export type Currency = string;
