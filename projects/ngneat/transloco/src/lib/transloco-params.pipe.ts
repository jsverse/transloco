import { Inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';

@Pipe({
  name: 'translocoParams'
})
export class TranslocoParamsPipe implements PipeTransform {
  constructor(
    private service: TranslocoService,
    @Inject(TRANSLOCO_MISSING_HANDLER) private missingHandler: TranslocoMissingHandler
  ) {}

  transform(value: string, params?: HashMap) {
    if (!value) {
      this.missingHandler.handle(value, this.service.config);
    }

    return this.service.transpile(value, params);
  }
}
