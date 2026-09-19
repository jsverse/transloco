import { NgModule } from '@angular/core';

import { TranslocoDirective } from './transloco.directive';
import { TranslocoPipe } from './transloco.pipe';

const decl = [TranslocoDirective, TranslocoPipe];

/**
 * @deprecated Import the standalone {@link TranslocoDirective} and
 * {@link TranslocoPipe} directly instead.
 */
@NgModule({
  imports: decl,
  exports: decl,
})
export class TranslocoModule {}
