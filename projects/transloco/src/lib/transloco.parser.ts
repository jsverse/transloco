import { InjectionToken } from '@angular/core';
import { HashMap } from './types';
import { getValue } from './helpers';

export const TRANSLOCO_PARSER = new InjectionToken('TRANSLOCO_PARSER');

export abstract class TranslocoParser {
  abstract parse(value: string, params: HashMap, lang: HashMap): string;
}

export class DefaultParser extends TranslocoParser {
  parse(value: string, params: HashMap, lang?: HashMap) {
    return value
      ? value.replace(/{{(.*?)}}/g, function(_, match) {
          match = match.trim();
          return params[match] || getValue(lang, match) || '';
        })
      : value;
  }
}
