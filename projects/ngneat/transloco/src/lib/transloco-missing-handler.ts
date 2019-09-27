import { InjectionToken } from '@angular/core';

export const TRANSLOCO_MISSING_HANDLER = new InjectionToken('TRANSLOCO_MISSING_HANDLER');

export interface MissingHandlerOptions {
  useFallback: boolean;
  prodMode: boolean;
  fallback?: any;
}

export interface TranslocoMissingHandler {
  handle(key: string, config: any): any;
}

export class DefaultHandler implements TranslocoMissingHandler {
  handle(key: string, config: MissingHandlerOptions) {
    if (!config.prodMode) {
      const msg = `Missing translation for '${key}'`;
      console.warn(`%c ${msg}`, 'font-size: 12px; color: red');
    }
    if (config.useFallback && config.fallback[key]) {
      return config.fallback[key];
    }

    return key;
  }
}
