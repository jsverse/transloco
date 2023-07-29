import {
  Currency,
  LangToLocaleMapping,
  Locale,
  LocaleConfig,
  LocaleToCurrencyMapping,
  TranslocoLocaleConfig,
} from './transloco-locale.types';
import { makeEnvironmentProviders, Type } from '@angular/core';
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
  DefaultNumberTransformer,
  TRANSLOCO_DATE_TRANSFORMER,
  TRANSLOCO_NUMBER_TRANSFORMER,
  TranslocoDateTransformer,
  TranslocoNumberTransformer,
} from './transloco-locale.transformers';

export function provideTranslocoLocale(config: TranslocoLocaleConfig) {
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
