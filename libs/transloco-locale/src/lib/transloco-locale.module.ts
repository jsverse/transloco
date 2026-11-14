import { NgModule } from '@angular/core';

import {
  TranslocoCurrencyPipe,
  TranslocoDatePipe,
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
} from './pipes';

const decl = [
  TranslocoCurrencyPipe,
  TranslocoDatePipe,
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
];

/**
 * @deprecated Import the standalone {@link TranslocoCurrencyPipe},
 * {@link TranslocoDatePipe}, {@link TranslocoDecimalPipe} and
 * {@link TranslocoPercentPipe} directly instead, and configure with
 * {@link provideTranslocoLocale}. Will be removed in v10.
 */
@NgModule({
  imports: decl,
  exports: decl,
})
export class TranslocoLocaleModule {}
