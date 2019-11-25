import { InjectionToken } from '@angular/core';
import { TranslocoConfig } from './transloco.config';

export const TRANSLOCO_MISSING_HANDLER = new InjectionToken('TRANSLOCO_MISSING_HANDLER');

export interface TranslocoMissingHandlerData extends TranslocoConfig {
  activeLang: string;
}

export interface TranslocoMissingHandler {
  handle(key: string, data: TranslocoMissingHandlerData): any;
}

export class DefaultHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig) {
    if (config.missingHandler.logMissingKey && !config.prodMode) {
      const msg = `Missing translation for '${key}'`;
      console.warn(`%c ${msg}`, 'font-size: 12px; color: red');
    }

    return key;
  }
}
