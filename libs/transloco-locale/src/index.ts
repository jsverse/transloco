export { TranslocoLocaleService } from './lib/transloco-locale.service';
export {
  TRANSLOCO_LOCALE_CONFIG,
  TRANSLOCO_LOCALE_CURRENCY_MAPPING,
  TRANSLOCO_LOCALE_DEFAULT_CURRENCY,
  TRANSLOCO_LOCALE_DEFAULT_LOCALE,
  TRANSLOCO_LOCALE_LANG_MAPPING,
} from './lib/transloco-locale.config';
export { TranslocoLocaleModule } from './lib/transloco-locale.module';
export {
  TRANSLOCO_DATE_TRANSFORMER,
  TRANSLOCO_DATE_RANGE_TRANSFORMER,
  TRANSLOCO_NUMBER_TRANSFORMER,
  TranslocoDateTransformer,
  TranslocoDateRangeTransformer,
  TranslocoNumberTransformer,
  DefaultDateTransformer,
  DefaultNumberTransformer,
} from './lib/transloco-locale.transformers';
export {
  provideTranslocoLocaleLangMapping,
  provideTranslocoLocaleCurrencyMapping,
  provideTranslocoDateTransformer,
  provideTranslocoDateRangeTransformer,
  provideTranslocoDefaultCurrency,
  provideTranslocoLocale,
  provideTranslocoNumberTransformer,
  provideTranslocoLocaleConfig,
  provideTranslocoDefaultLocale,
} from './lib/transloco-locale.providers';
export * from './lib/transloco-locale.types';
export {
  TranslocoCurrencyPipe,
  TranslocoDatePipe,
  TranslocoDateRangePipe,
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
  BaseLocalePipe,
} from './lib/pipes';
