import { InjectionToken } from '@angular/core';
import { AvailableLangs, HashMap } from './types';

export type TranslocoConfig = {
  defaultLang: string;
  renderLangOnce?: boolean;
  prodMode?: boolean;
  fallbackLang?: string | string[];
  failedRetries?: number;
  scopeMapping?: HashMap<string>;
  availableLangs?: AvailableLangs;
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
  renderLangOnce: false,
  prodMode: false,
  failedRetries: 2,
  availableLangs: [],
  missingHandler: {
    allowEmpty: false
  }
};
