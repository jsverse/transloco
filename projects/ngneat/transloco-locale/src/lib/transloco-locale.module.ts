import { NgModule, ModuleWithProviders } from '@angular/core';
import { TranslocoCurrencyPipe } from './pipes/transloco-currency.pipe';
import { TranslocoDatePipe } from './pipes/transloco-date.pipe';
import { TranslocoDecimalPipe } from './pipes/transloco-decimal.pipe';
import { TranslocoPercentPipe } from './pipes/transloco-percent.pipe';
import {
  TranslocoLocaleConfig,
  LOCALE_CURRENCY_MAPPING,
  LOCALE_LANG_MAPPING,
  defaultConfig,
  LOCALE_DEFAULT_LOCALE,
  LOCALE_CONFIG
} from './transloco-locale.config';

export const pipes = [TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe];

@NgModule({
  declarations: pipes,
  exports: pipes
})
export class TranslocoLocaleModule {
  static init(config: TranslocoLocaleConfig = {}): ModuleWithProviders {
    return {
      ngModule: TranslocoLocaleModule,
      providers: [
        {
          provide: LOCALE_LANG_MAPPING,
          useValue: config.langToLocaleMapping || defaultConfig.langToLocaleMapping
        },
        {
          provide: LOCALE_CONFIG,
          useValue: config.localeConfig || defaultConfig.localeConfig
        },
        {
          provide: LOCALE_CURRENCY_MAPPING,
          useValue: config.localeToCurrencyMapping || defaultConfig.localeToCurrencyMapping
        },
        {
          provide: LOCALE_DEFAULT_LOCALE,
          useValue: config.defaultLocale || defaultConfig.defaultLocale
        }
      ]
    };
  }
}
