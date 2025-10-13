import { Injectable, InjectionToken } from '@angular/core';

import { TranslocoConfig } from './transloco.config';
import { HashMap } from './utils/type.utils';

export const TRANSLOCO_MISSING_HANDLER =
  /* @__PURE__ */ new InjectionToken<TranslocoMissingHandlerData>(
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
    if (config.missingHandler.logMissingKey && !config.prodMode) {
      const msg = `Missing translation for '${key}'`;
      console.warn(`%c ${msg}`, 'font-size: 12px; color: red');
    }

    return key;
  }
}
