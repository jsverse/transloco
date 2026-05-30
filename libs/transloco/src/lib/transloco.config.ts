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
  /**
   * @deprecated This option will be removed in Transloco v9 with no config-level replacement.
   * For MFE setups where @jsverse/transloco is a shared singleton, avoid relying on the global
   * translate function — refer to the documentation for recommended patterns instead.
   * SSR opt-out will be handled automatically via `ngServerMode`.
   */
  enableGlobalTranslateFn?: boolean;
}

export const TRANSLOCO_CONFIG =
  /* @__PURE__ */ new InjectionToken<TranslocoConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_CONFIG' : '',
    {
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
  enableGlobalTranslateFn: true,
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
