import { InjectionToken } from '@angular/core';

import LOCALE_CURRENCY from './locale-currency';
import {
  TranslocoLocaleConfig,
  LocaleConfigMapping,
  LangToLocaleMapping,
  LocaleToCurrencyMapping,
  Locale,
  Currency,
} from './transloco-locale.types';

export const defaultConfig: Required<TranslocoLocaleConfig> = {
  localeConfig: {
    global: {},
    localeBased: {},
  },
  defaultLocale: 'en-US',
  defaultCurrency: 'USD',
  localeToCurrencyMapping: LOCALE_CURRENCY,
  langToLocaleMapping: {},
};

export const TRANSLOCO_LOCALE_DEFAULT_LOCALE =
  /* @__PURE__ */ new InjectionToken<Locale>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOCALE_DEFAULT_LOCALE'
      : '',
  );
export const TRANSLOCO_LOCALE_DEFAULT_CURRENCY =
  /* @__PURE__ */ new InjectionToken<Currency>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOCALE_DEFAULT_CURRENCY'
      : '',
  );
export const TRANSLOCO_LOCALE_LANG_MAPPING =
  /* @__PURE__ */ new InjectionToken<LangToLocaleMapping>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOCALE_LANG_MAPPING'
      : '',
  );
export const TRANSLOCO_LOCALE_CONFIG =
  /* @__PURE__ */ new InjectionToken<LocaleConfigMapping>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOCALE_CONFIG'
      : '',
  );
export const TRANSLOCO_LOCALE_CURRENCY_MAPPING =
  /* @__PURE__ */ new InjectionToken<LocaleToCurrencyMapping>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOCALE_CURRENCY_MAPPING'
      : '',
  );
