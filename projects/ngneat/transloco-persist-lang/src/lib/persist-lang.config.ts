import { InjectionToken, Provider } from '@angular/core';

export type PersistLangConfig = {
  storage: Provider;
  storageKey?: string;
  getLangFn?: (langs: { cachedLang: string; browserLang: string; cultureLang: string; defaultLang: string }) => string;
};

export const TRANSLOCO_PERSIST_LANG_STORAGE = new InjectionToken('TRANSLOCO_PERSIST_LANG_STORAGE');
export const TRANSLOCO_PERSIST_LANG_CONFIG = new InjectionToken('TRANSLOCO_PERSIST_LANG_CONFIG');
