import { Inject, InjectionToken } from '@angular/core';
import { TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';

export const TRANSLOCO_FALLBACK_STRATEGY = new InjectionToken<TranslocoFallbackStrategy>('TRANSLOCO_FALLBACK_STRATEGY');

export interface TranslocoFallbackStrategy {
  handle(failedLang: string): string[];
}

export class DefaultFallbackStrategy implements TranslocoFallbackStrategy {
  constructor(@Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig) {}

  handle(failedLang: string) {
    if (!this.userConfig.fallbackLang) {
      throw new Error('When using the default fallback, a fallback language must be provided in the config!');
    }
    return [this.userConfig.fallbackLang];
  }
}
