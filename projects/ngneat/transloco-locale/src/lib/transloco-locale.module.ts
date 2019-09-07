import { NgModule, ModuleWithProviders } from '@angular/core';
import { TranslocoCurrencyPipe } from './pipes/transloco-currency.pipe';
import { TranslocoDatePipe } from './pipes/transloco-date.pipe';
import { TranslocoDecimalPipe } from './pipes/transloco-decimal.pipe';
import { TranslocoPercentPipe } from './pipes/transloco-percent.pipe';
import { LOCALE_NUMBER_CONFIG, TranslocoLocaleConfig, LOCALE_DATE_CONFIG } from './transloco-locale.config';

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
        { provide: LOCALE_NUMBER_CONFIG, useValue: config.number || {} },
        { provide: LOCALE_DATE_CONFIG, useValue: config.date || {} }
      ]
    };
  }
}
