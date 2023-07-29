import {
  Locale,
  LocaleFormatOptions,
  LocaleConfig,
} from './transloco-locale.types';

export function getDefaultOptions<T extends keyof LocaleFormatOptions>(
  locale: Locale,
  style: T,
  localeConfig: LocaleConfig
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
