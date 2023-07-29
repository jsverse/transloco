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

@NgModule({
  imports: decl,
  exports: decl,
})
export class TranslocoLocaleModule {}
