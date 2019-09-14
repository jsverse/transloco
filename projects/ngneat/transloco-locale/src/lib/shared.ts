import { Locale } from './transloco-locale.types';
import { LocaleSettings, LocaleConfig } from './transloco-locale.config';

export function getDefaultOptions(locale: Locale, type: keyof LocaleSettings, localeConfig: LocaleConfig): any {
  const defaultConfig = localeConfig.global[type] || {};
  const settings = localeConfig.localeBased[locale];
  return settings && settings[type] ? settings[type] : defaultConfig;
}
