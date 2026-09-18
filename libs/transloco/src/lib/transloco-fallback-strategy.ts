import { Injectable, InjectionToken, inject } from '@angular/core';

import { injectTranslocoConfig } from './transloco.config';
import {
  formatTranslocoError,
  TranslocoErrorCode,
} from './transloco-error-code';

export const TRANSLOCO_FALLBACK_STRATEGY =
  /* @__PURE__ */ new InjectionToken<TranslocoFallbackStrategy>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_FALLBACK_STRATEGY'
      : '',
  );

/** Resolves the provided `TRANSLOCO_FALLBACK_STRATEGY`. */
export function injectFallbackStrategy(): TranslocoFallbackStrategy {
  return inject(TRANSLOCO_FALLBACK_STRATEGY);
}

export interface TranslocoFallbackStrategy {
  getNextLangs(failedLang: string): string[];
}

@Injectable()
export class DefaultFallbackStrategy implements TranslocoFallbackStrategy {
  private readonly userConfig = injectTranslocoConfig();

  getNextLangs() {
    const fallbackLang = this.userConfig.fallbackLang;
    if (!fallbackLang) {
      let message: string;
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        message =
          'When using the default fallback, a fallback language must be provided in the config!';
      } else {
        message = formatTranslocoError(
          TranslocoErrorCode.NoFallbackLanguageProvided,
        );
      }
      throw new Error(message);
    }

    return Array.isArray(fallbackLang) ? fallbackLang : [fallbackLang];
  }
}
