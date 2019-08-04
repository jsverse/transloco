import { NgModule } from '@angular/core';
import { TranslocoLoaderComponent } from './loader-component.component';
import { TranslocoDirective } from './transloco.directive';
import { TRANSLOCO_PARSER, DefaultParser } from './transloco.parser';
import { TranslocoParamsPipe } from './transloco-params.pipe';
import { TranslocoPipe } from './transloco.pipe';
import { DefaultHandler, TRANSLOCO_MISSING_HANDLER } from './transloco-missing-handler';

@NgModule({
  declarations: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe, TranslocoLoaderComponent],
  providers: [
    {
      provide: TRANSLOCO_PARSER,
      useClass: DefaultParser
    },
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: DefaultHandler
    }
  ],
  exports: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe],
  entryComponents: [TranslocoLoaderComponent]
})
export class TranslocoModule {}
