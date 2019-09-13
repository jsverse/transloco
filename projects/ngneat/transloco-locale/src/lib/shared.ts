import { Locale, LocaleSettings } from '@ngneat/transloco-locale';

export function getDefaultOptions(locale: Locale, type: keyof LocaleSettings, localeSettings, defaultConfig = {}) {
  const settings = localeSettings[locale];
  return settings && settings[type] ? settings[type] : defaultConfig;
}
