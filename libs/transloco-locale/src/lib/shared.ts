import { Locale } from './transloco-locale.types';
import { LocaleFormatOptions, LocaleConfig } from './transloco-locale.config';

export function getDefaultOptions(locale: Locale, type: keyof LocaleFormatOptions, localeConfig: LocaleConfig): any {
  const defaultConfig = localeConfig.global[type] || {};
  const settings = localeConfig.localeBased[locale];
  return settings && settings[type] ? { ...defaultConfig, ...settings[type] } : defaultConfig;
}
