import { InjectionToken } from '@angular/core';
import { TranslocoConfig } from './transloco.config';

export const TRANSLOCO_MISSING_HANDLER = new InjectionToken('TRANSLOCO_MISSING_HANDLER');

export interface TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig): any;
}

export class DefaultHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig) {
    if (!config.prodMode) {
      const msg = `Missing translation for '${key}'`;
      console.warn(`%c ${msg}`, 'font-size: 12px; color: red');
    }

    return key;
  }
}
