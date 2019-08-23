import { InjectionToken } from '@angular/core';

export type PersistLangConfig = {
  storage?: 'local' | 'session' | 'cookie';
  storageKey?: string;
  cookieExpiry?: number;
  strategy?: 'auto' | 'manual';
};

export const TRANSLOCO_PERSIST_LANG_CONFIG = new InjectionToken<PersistLangConfig>('TRANSLOCO_PERSIST_LANG_CONFIG');

export const defaults: Partial<PersistLangConfig> = {
  storageKey: 'translocoLang',
  storage: 'local',
  strategy: 'auto',
  cookieExpiry: 720 // a month
};
