import { Locale } from './transloco-locale.types';
import { LocaleSettings } from './transloco-locale.config';

export function getDefaultOptions(locale: Locale, type: keyof LocaleSettings, localeSettings, defaultConfig = {}) {
  const settings = localeSettings[locale];
  return settings && settings[type] ? settings[type] : defaultConfig;
}
