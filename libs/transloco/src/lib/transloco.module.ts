import { NgModule } from '@angular/core';
import { TranslocoLoaderComponent } from './loader-component.component';
import { TranslocoDirective } from './transloco.directive';
import { defaultProviders } from './transloco.providers';
import { TranslocoPipe } from './transloco.pipe';

@NgModule({
  declarations: [TranslocoDirective, TranslocoPipe, TranslocoLoaderComponent],
  providers: [defaultProviders],
  exports: [TranslocoDirective, TranslocoPipe],
})
export class TranslocoModule {}
