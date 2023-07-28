import {
  Locale,
  LocaleFormatOptions,
  LocaleConfig,
} from './transloco-locale.types';

export function getDefaultOptions(
  locale: Locale,
  type: keyof LocaleFormatOptions,
  localeConfig: LocaleConfig
): any {
  const defaultConfig = localeConfig.global ? localeConfig.global[type] : {};
  const settings = localeConfig.localeBased
    ? localeConfig.localeBased[locale]
    : {};

  return settings?.[type]
    ? { ...defaultConfig, ...settings[type] }
    : defaultConfig;
}
