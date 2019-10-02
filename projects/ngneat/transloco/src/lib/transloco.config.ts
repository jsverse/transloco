import { InjectionToken } from '@angular/core';
import { AvailableLangs, HashMap } from './types';

export type TranslocoConfig = {
  defaultLang: string;
  reRenderOnLangChange?: boolean;
  prodMode?: boolean;
  fallbackLang?: string | string[];
  failedRetries?: number;
  scopeMapping?: HashMap<string>;
  availableLangs?: AvailableLangs;
  flatten?: {
    aot?: boolean;
  };
  missingHandler?: {
    useFallbackTranslation?: boolean;
    allowEmpty?: boolean;
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
  reRenderOnLangChange: false,
  prodMode: false,
  failedRetries: 2,
  availableLangs: [],
  missingHandler: {
    useFallbackTranslation: false,
    allowEmpty: false
  },
  flatten: {
    aot: false
  }
};
