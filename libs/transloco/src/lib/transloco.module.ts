import { NgModule } from '@angular/core';

import { TranslocoLoaderComponent } from './loader-component.component';
import { TranslocoDirective } from './transloco.directive';
import { TranslocoPipe } from './transloco.pipe';

const decl = [TranslocoDirective, TranslocoPipe];

@NgModule({
  imports: decl,
  exports: decl,
})
export class TranslocoModule {}
