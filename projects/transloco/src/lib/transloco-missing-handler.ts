import { InjectionToken } from '@angular/core';
import { HashMap } from './types';
import { TranslocoConfig } from '@ngneat/transloco';

export const TRANSLOCO_MISSING_HANDLER = new InjectionToken('TRANSLOCO_MISSING_HANDLER');

export abstract class TranslocoMissingHandler {
  abstract handle(key: string, params: HashMap, config: TranslocoConfig): any;
}

export class DefaultHandler extends TranslocoMissingHandler {
  handle(key: string, params: HashMap, config: TranslocoConfig) {
    if (!config.prodMode) {
      console.warn(`%c Missing translation for '${key}' 🤔🕵🏻‍♀`, 'font-size: 12px; color: red');
    }
    return '';
  }
}
