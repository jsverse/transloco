import { InjectionToken } from '@angular/core';
import { HashMap } from './types';

export type TranslocoConfig = {
  defaultLang: string;
  listenToLangChange?: boolean;
  prodMode?: boolean;
  fallbackLang?: string | string[];
  failedRetries?: number;
  scopeStrategy?: 'shared';
  scopeMapping?: HashMap<string>;
  missingHandler?: {
    allowEmpty: boolean;
  };
};

export const TRANSLOCO_CONFIG = new InjectionToken('TRANSLOCO_CONFIG', {
  providedIn: 'root',
  factory: () => {
    return {};
  }
});

export const defaultConfig: TranslocoConfig = {
  defaultLang: 'en',
  listenToLangChange: false,
  prodMode: false,
  failedRetries: 2,
  missingHandler: {
    allowEmpty: false
  }
};
