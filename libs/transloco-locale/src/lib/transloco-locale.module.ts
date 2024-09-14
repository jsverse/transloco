import { NgModule } from '@angular/core';

import {
  TranslocoCurrencyPipe,
  TranslocoDatePipe,
  TranslocoDateRangePipe,
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
} from './pipes';

const decl = [
  TranslocoCurrencyPipe,
  TranslocoDatePipe,
  TranslocoDateRangePipe,
  TranslocoDecimalPipe,
  TranslocoPercentPipe,
];

@NgModule({
  imports: decl,
  exports: decl,
})
export class TranslocoLocaleModule { }
