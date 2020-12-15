import { TranslocoConfig, TranslocoTestingModule, TranslocoTestingOptions } from '@ngneat/transloco';
import en from '../assets/i18n/en.json';
import es from '../assets/i18n/es.json';
import admin from '../assets/i18n/admin-page/en.json';
import adminSpanish from '../assets/i18n/admin-page/es.json';
import lazy from '../assets/i18n/lazy-page/en.json';
import lazySpanish from '../assets/i18n/lazy-page/es.json';

export function getTranslocoModule(
  config: Partial<TranslocoConfig> = {},
  options: Partial<TranslocoTestingOptions> = {}
) {
  return TranslocoTestingModule.withOptions({
    langs: {
      en,
      es,
      'admin-page/en': admin,
      'admin-page/es': adminSpanish,
      'lazy-page/en': lazy,
      'lazy-page/es': lazySpanish
    },
    translocoConfig: {
      availableLangs: ['es', 'en'],
      defaultLang: 'es',
      ...config
    },
    ...options
  });
}
