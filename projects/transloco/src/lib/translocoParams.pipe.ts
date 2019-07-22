import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';

@Pipe({
  name: 'translocoParams'
})
export class TranslocoParamsPipe implements PipeTransform {
  constructor(private service: TranslocoService) {}

  transform(value: string, params: HashMap) {
    return this.service.translateValue(value, params);
  }
}
