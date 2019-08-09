import { InjectionToken } from '@angular/core';
import { HashMap, Translation } from './types';
import { getValue, isString } from './helpers';

export const TRANSLOCO_TRANSPILER = new InjectionToken('TRANSLOCO_TRANSPILER');

export interface TranslocoTranspiler {
  transpile(value: string, params: HashMap, translation: HashMap): string;
}

export class DefaultTranspiler implements TranslocoTranspiler {
  transpile(value: string, params: HashMap = {}, translation: Translation): string {
    return isString(value)
      ? value.replace(/{{(.*?)}}/g, function(_, match) {
          match = match.trim();
          return params[match] || getValue(translation, match) || '';
        })
      : value;
  }
}
