import {
  DateFormatOptions,
  Locale,
  LocaleFormatOptions,
  LocaleConfig,
} from './transloco-locale.types';

export function getDefaultOptions<T extends keyof LocaleFormatOptions>(
  locale: Locale,
  style: T,
  localeConfig: LocaleConfig,
) {
  const defaultConfig = (localeConfig.global?.[style] ?? {}) as NonNullable<
    LocaleFormatOptions[T]
  >;
  const settings = (localeConfig.localeBased?.[locale] ??
    {}) as LocaleFormatOptions;

  return Reflect.has(settings, style)
    ? { ...defaultConfig, ...settings[style] }
    : defaultConfig;
}

const DATE_STYLE_KEYS = ['dateStyle', 'timeStyle'];
const DATE_COMPONENT_KEYS = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName',
];

/**
 * `Intl.DateTimeFormat` throws when `dateStyle`/`timeStyle` are combined with
 * explicit component options (`year`, `hour`, ...). Spreading the global config
 * over the pipe params can produce exactly that mix, so drop whichever group the
 * caller's params conflict with before merging; non-conflicting keys such as
 * `timeZone` are kept either way.
 */
export function mergeDateOptions(
  defaults: DateFormatOptions,
  options: DateFormatOptions,
): DateFormatOptions {
  const uses = (keys: string[]) =>
    keys.some((key) => options[key as keyof DateFormatOptions] !== undefined);

  const merged: Record<string, unknown> = { ...defaults };
  const drop = (keys: string[]) => keys.forEach((key) => delete merged[key]);

  if (uses(DATE_COMPONENT_KEYS)) drop(DATE_STYLE_KEYS);
  if (uses(DATE_STYLE_KEYS)) drop(DATE_COMPONENT_KEYS);

  return { ...merged, ...options };
}
