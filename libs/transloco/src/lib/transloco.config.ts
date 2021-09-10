import { InjectionToken, Provider } from '@angular/core';
import { AvailableLangs, HashMap } from './types';

export interface TranslocoConfig {
  defaultLang: string;
  reRenderOnLangChange?: boolean;
  prodMode?: boolean;
  fallbackLang?: string | string[];
  failedRetries?: number;
  availableLangs?: AvailableLangs;
  flatten?: {
    aot?: boolean;
  };
  missingHandler?: {
    logMissingKey?: boolean;
    useFallbackTranslation?: boolean;
    allowEmpty?: boolean;
  };
  interpolation?: [string, string];
}

export const TRANSLOCO_CONFIG = new InjectionToken<TranslocoConfig>(
  'TRANSLOCO_CONFIG',
  {
    providedIn: 'root',
    factory: () => {
      return { defaultLang: 'en' };
    },
  }
);

export const defaultConfig: Omit<
  Required<TranslocoConfig>,
  'scopeMapping' | 'fallbackLang'
> = {
  defaultLang: 'en',
  reRenderOnLangChange: false,
  prodMode: false,
  failedRetries: 2,
  availableLangs: [],
  missingHandler: {
    logMissingKey: true,
    useFallbackTranslation: false,
    allowEmpty: false,
  },
  flatten: {
    aot: false,
  },
  interpolation: ['{{', '}}'],
};

/**
 * Sets up TranslocoConfig object.
 *
 * @param config The partial config object to load, this is optional,
 * will be spread after defaultConfig.
 */
export function translocoConfig(
  config: Partial<TranslocoConfig> = defaultConfig
): TranslocoConfig {
  return { ...defaultConfig, ...config };
}
