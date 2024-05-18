import { makeEnvironmentProviders, Type } from '@angular/core';

import {
  Currency,
  LangToLocaleMapping,
  Locale,
  LocaleConfig,
  LocaleToCurrencyMapping,
  TranslocoLocaleConfig,
} from './transloco-locale.types';
import {
  defaultConfig,
  TRANSLOCO_LOCALE_CONFIG,
  TRANSLOCO_LOCALE_CURRENCY_MAPPING,
  TRANSLOCO_LOCALE_DEFAULT_CURRENCY,
  TRANSLOCO_LOCALE_DEFAULT_LOCALE,
  TRANSLOCO_LOCALE_LANG_MAPPING,
} from './transloco-locale.config';
import {
  DefaultDateTransformer,
  DefaultDateRangeTransformer,
  DefaultNumberTransformer,
  TRANSLOCO_DATE_TRANSFORMER,
  TRANSLOCO_DATE_RANGE_TRANSFORMER,
  TRANSLOCO_NUMBER_TRANSFORMER,
  TranslocoDateTransformer,
  TranslocoNumberTransformer,
  TranslocoDateRangeTransformer,
} from './transloco-locale.transformers';

export function provideTranslocoLocale(config?: TranslocoLocaleConfig) {
  const merged = {
    ...defaultConfig,
    ...config,
  };

  return [
    provideTranslocoLocaleConfig(merged.localeConfig),
    provideTranslocoDefaultLocale(merged.defaultLocale),
    provideTranslocoDefaultCurrency(merged.defaultCurrency),
    provideTranslocoLocaleLangMapping(merged.langToLocaleMapping),
    provideTranslocoLocaleCurrencyMapping(merged.localeToCurrencyMapping),
    provideTranslocoDateTransformer(DefaultDateTransformer),
    provideTranslocoDateRangeTransformer(DefaultDateRangeTransformer),
    provideTranslocoNumberTransformer(DefaultNumberTransformer),
  ];
}

export function provideTranslocoLocaleConfig(config: LocaleConfig) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_LOCALE_CONFIG,
      useValue: config,
    },
  ]);
}

export function provideTranslocoLocaleLangMapping(
  langToLocale: LangToLocaleMapping
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_LOCALE_LANG_MAPPING,
      useValue: langToLocale,
    },
  ]);
}

export function provideTranslocoLocaleCurrencyMapping(
  localeToCurrency: LocaleToCurrencyMapping
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_LOCALE_CURRENCY_MAPPING,
      useValue: localeToCurrency,
    },
  ]);
}

export function provideTranslocoDefaultLocale(defaultLocale: Locale) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_LOCALE_DEFAULT_LOCALE,
      useValue: defaultLocale,
    },
  ]);
}

export function provideTranslocoDefaultCurrency(defaultCurrency: Currency) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_LOCALE_DEFAULT_CURRENCY,
      useValue: defaultCurrency,
    },
  ]);
}

export function provideTranslocoDateTransformer(
  transformer: Type<TranslocoDateTransformer>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_DATE_TRANSFORMER,
      useClass: transformer,
    },
  ]);
}
export function provideTranslocoDateRangeTransformer(
  transformer: Type<TranslocoDateRangeTransformer>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_DATE_RANGE_TRANSFORMER,
      useClass: transformer,
    },
  ]);
}

export function provideTranslocoNumberTransformer(
  transformer: Type<TranslocoNumberTransformer>
) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_NUMBER_TRANSFORMER,
      useClass: transformer,
    },
  ]);
}
