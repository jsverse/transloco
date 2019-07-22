import { NgModule } from '@angular/core';
import { TranslocoDirective } from './transloco.directive';
import { TRANSLOCO_PARSER, DefaultParser } from './transloco.parser';
import { TranslocoParamsPipe } from './translocoParams.pipe';

@NgModule({
  declarations: [TranslocoDirective, TranslocoParamsPipe],
  providers: [
    {
      provide: TRANSLOCO_PARSER,
      useClass: DefaultParser
    }
  ],
  exports: [TranslocoDirective, TranslocoParamsPipe]
})
export class TranslocoModule {}
