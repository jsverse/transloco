import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';

export const TRANSLOCO_FALLBACK_STRATEGY =
  new InjectionToken<TranslocoFallbackStrategy>('TRANSLOCO_FALLBACK_STRATEGY');

export interface TranslocoFallbackStrategy {
  getNextLangs(failedLang: string): string[];
}

@Injectable()
export class DefaultFallbackStrategy implements TranslocoFallbackStrategy {
  constructor(@Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig) {}

  getNextLangs() {
    const fallbackLang = this.userConfig.fallbackLang;
    if (!fallbackLang) {
      throw new Error(
        'When using the default fallback, a fallback language must be provided in the config!'
      );
    }

    return Array.isArray(fallbackLang) ? fallbackLang : [fallbackLang];
  }
}
