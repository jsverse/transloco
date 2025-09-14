import { InjectionToken } from '@angular/core';

import { AvailableLangs } from './transloco.types';

export interface TranslocoConfig {
  defaultLang: string;
  reRenderOnLangChange: boolean;
  prodMode: boolean;
  fallbackLang?: string | string[];
  failedRetries: number;
  availableLangs: AvailableLangs;
  flatten: {
    aot: boolean;
  };
  missingHandler: {
    logMissingKey: boolean;
    useFallbackTranslation: boolean;
    allowEmpty: boolean;
  };
  interpolation: [string, string];
  scopes: {
    keepCasing?: boolean;
    autoPrefixKeys?: boolean;
  };
}

export const TRANSLOCO_CONFIG = new InjectionToken<TranslocoConfig>(
  ngDevMode ? 'TRANSLOCO_CONFIG' : '',
  {
    providedIn: 'root',
    factory: () => defaultConfig,
  },
);

export const defaultConfig: TranslocoConfig = {
  defaultLang: 'en',
  reRenderOnLangChange: false,
  prodMode: false,
  failedRetries: 2,
  fallbackLang: [],
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
  scopes: {
    keepCasing: false,
    autoPrefixKeys: true,
  },
};

type DeepPartial<T> =
  T extends Array<any>
    ? T
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

export type PartialTranslocoConfig = DeepPartial<TranslocoConfig>;

export function translocoConfig(
  config: PartialTranslocoConfig = {},
): TranslocoConfig {
  return {
    ...defaultConfig,
    ...config,
    missingHandler: {
      ...defaultConfig.missingHandler,
      ...config.missingHandler,
    },
    flatten: {
      ...defaultConfig.flatten,
      ...config.flatten,
    },
    scopes: {
      ...defaultConfig.scopes,
      ...config.scopes,
    },
  };
}
