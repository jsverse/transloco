import { InjectionToken } from '@angular/core';

export type TranslocoConfig = {
  defaultLang: string;
  listenToLangChange?: boolean;
  prodMode?: boolean;
  fallbackLang?: string;
  failedRetries?: number;
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
  failedRetries: 2
};
