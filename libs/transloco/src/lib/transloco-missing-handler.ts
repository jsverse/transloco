import { Injectable, InjectionToken } from '@angular/core';

import { TranslocoConfig } from './transloco.config';
import { HashMap } from './types';

export const TRANSLOCO_MISSING_HANDLER =
  new InjectionToken<TranslocoMissingHandlerData>(
    ngDevMode ? 'TRANSLOCO_MISSING_HANDLER' : '',
  );

export interface TranslocoMissingHandlerData extends TranslocoConfig {
  activeLang: string;
}

export interface TranslocoMissingHandler {
  handle(key: string, data: TranslocoMissingHandlerData, params?: HashMap): any;
}

@Injectable()
export class DefaultMissingHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig) {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      if (config.missingHandler.logMissingKey) {
        const msg = `Missing translation for '${key}'`;
        console.warn(`%c ${msg}`, 'font-size: 12px; color: red');
      }
    }

    return key;
  }
}
