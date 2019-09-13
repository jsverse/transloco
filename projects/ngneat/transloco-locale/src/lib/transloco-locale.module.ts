import { NgModule, ModuleWithProviders } from '@angular/core';
import { TranslocoCurrencyPipe } from './pipes/transloco-currency.pipe';
import { TranslocoDatePipe } from './pipes/transloco-date.pipe';
import { TranslocoDecimalPipe } from './pipes/transloco-decimal.pipe';
import { TranslocoPercentPipe } from './pipes/transloco-percent.pipe';
import {
  LOCALE_NUMBER_CONFIG,
  TranslocoLocaleConfig,
  LOCALE_DATE_CONFIG,
  LOCALE_CURRENCY_MAPPING,
  LOCALE_LANG_MAPPING,
  defaultConfig,
  LOCALE_DEFAULT_LOCALE,
  LOCALE_SETTINGS
} from './transloco-locale.config';

export const pipes = [TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe, TranslocoPercentPipe];

@NgModule({
  declarations: pipes,
  imports: [],
  exports: pipes
})
export class TranslocoLocaleModule {
  static init(config: TranslocoLocaleConfig = {}): ModuleWithProviders {
    return {
      ngModule: TranslocoLocaleModule,
      providers: [
        { provide: LOCALE_NUMBER_CONFIG, useValue: config.number || defaultConfig.number },
        { provide: LOCALE_DATE_CONFIG, useValue: config.date || defaultConfig.date },
        {
          provide: LOCALE_LANG_MAPPING,
          useValue: config.langToLocaleMapping || defaultConfig.langToLocaleMapping
        },
        {
          provide: LOCALE_SETTINGS,
          useValue: config.localeSettings || defaultConfig.localeSettings
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
