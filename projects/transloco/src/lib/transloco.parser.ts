import { InjectionToken } from '@angular/core';
import { HashMap, Translation } from './types';
import { getValue, isString } from './helpers';

export const TRANSLOCO_PARSER = new InjectionToken('TRANSLOCO_PARSER');

export interface TranslocoParser {
  parse(value: string, params: HashMap, lang: HashMap): string;
}

export class DefaultParser implements TranslocoParser {
  parse(value: string, params: HashMap = {}, translation: Translation): string {
    return isString(value)
      ? value.replace(/{{(.*?)}}/g, function(_, match) {
          match = match.trim();
          return params[match] || getValue(translation, match) || '';
        })
      : value;
  }
}
