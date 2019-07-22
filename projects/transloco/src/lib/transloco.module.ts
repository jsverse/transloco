import { NgModule } from '@angular/core';
import { TranslocoDirective } from './transloco.directive';
import { TRANSLOCO_PARSER, DefaultParser } from './transloco.parser';
import { TranslocoParamsPipe } from './translocoParams.pipe';
import {TranslocoPipe} from "./transloco.pipe";

@NgModule({
  declarations: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe],
  providers: [
    {
      provide: TRANSLOCO_PARSER,
      useClass: DefaultParser
    }
  ],
  exports: [TranslocoDirective, TranslocoParamsPipe, TranslocoPipe]
})
export class TranslocoModule {}
