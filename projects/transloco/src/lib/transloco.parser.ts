import { InjectionToken } from '@angular/core';
import { HashMap } from './types';

export const TRANSLOCO_PARSER = new InjectionToken('TRANSLOCO_PARSER');

export abstract class TranslocoParser {
  abstract parse(value: string, params: HashMap): string;
}

export class DefaultParser extends TranslocoParser {
  parse(value: string, params: HashMap) {
    return value.replace(/{{(.+)}}/g, function(_, match) {
      return params[match] || '';
    });
  }
}
