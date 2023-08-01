export interface NumberFormatOptions {
  /**
   * When to display the sign for the number.
   */
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
  /**
   * The currency to use in currency formatting. Possible values are the ISO 4217 currency codes, such as "USD" for the US dollar, "EUR" for the euro
   */
  currency?: Intl.NumberFormatOptions['currency'];
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
  maximumSignificantDigits?: Intl.NumberFormatOptions['maximumSignificantDigits'];
  /**
   * When to display the sign for the number. Possible values are "auto", "always", "exceptZero", "negative", "never"; the default is "auto".
   */
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
}

/**
 * The number display formatting type.
 */
export type NumberStyles = 'currency' | 'decimal' | 'percent';

/**
 * Allowed values with Date and Time formats
 */
export type DateFormatStyles = 'full' | 'long' | 'medium' | 'short';

/**
 * Common allowed formats for time zones
 */
export type TimezoneNameFormats = 'short' | 'long';

/**
 * Common allowed formats for date strings
 */
export type DateStringFormats = TimezoneNameFormats | 'narrow';

/**
 * Common allowed formats for numbers
 */
export type DateNumberFormats = 'numeric' | '2-digit';

/**
 * Supported Intl calender types
 */
export interface DateFormatOptions {
  /**
   * The date formatting style.
   */
  dateStyle?: DateFormatStyles;
  /**
   * The time formatting style.
   */
  timeStyle?: DateFormatStyles;
  /**
   * Number of fractional seconds to show
   */
  fractionalSecondDigits?: 0 | 1 | 2 | 3;
  /**
   * The way day periods should be displayed
   */
  dayPeriod?: DateStringFormats;
  /**
   * The option for 12/24 hour display
   */
  hour12?: boolean;
  /**
   * Locale matcher options
   */
  localeMatcher?: 'lookup' | 'best fit';
  /**
   * Format matcher options
   */
  formatMatcher?: 'lookup' | 'best fit';
  /**
   * The weekday formatting style
   */
  weekday?: DateStringFormats;
  /**
   * The era formatting style
   */
  era?: DateStringFormats;
  /**
   * The year formatting style
   */
  year?: DateNumberFormats;
  /**
   * The Month formatting style
   */
  month?: DateStringFormats | DateNumberFormats;
  /**
   * The Day formatting style
   */
  day?: DateNumberFormats;
  /**
   * The Hour formatting style
   */
  hour?: DateNumberFormats;
  /**
   * The Minute formatting style
   */
  minute?: DateNumberFormats;
  /**
   * The Seconds formatting style
   */
  second?: DateNumberFormats;
  /**
   * The time zone to use. The only value implementations must recognize is "UTC"; the default is the runtime's default time zone. Implementations may also recognize the time zone names of the IANA time zone database, such as "Asia/Shanghai", "Asia/Kolkata", "America/New_York".
   */
  timeZone?: Intl.DateTimeFormatOptions['timeZone'];
  /**
   * The formatting for the time zone name
   */
  timeZoneName?: TimezoneNameFormats;
}

//BCP 47 locale string (e.g. en-US, es-ES).
export type Locale = string;

//ISO 4217 currency string (e.g. USD, EUR).
export type Currency = string;

export type ValidDate = Date | string | number;

export interface LocaleFormatOptions {
  date?: DateFormatOptions;
  decimal?: NumberFormatOptions;
  currency?: NumberFormatOptions;
  percent?: NumberFormatOptions;
  unit?: NumberFormatOptions;
}

export type LocaleConfigMapping = Record<string, LocaleFormatOptions>;
export type LangToLocaleMapping = Record<string, Locale>;
export type LocaleToCurrencyMapping = Record<string, Currency>;

export interface LocaleConfig {
  global?: LocaleFormatOptions;
  localeBased?: LocaleConfigMapping;
}

export interface TranslocoLocaleConfig {
  defaultLocale?: Locale;
  defaultCurrency?: Currency;
  localeConfig?: LocaleConfig;
  langToLocaleMapping?: LangToLocaleMapping;
  localeToCurrencyMapping?: LocaleToCurrencyMapping;
}
