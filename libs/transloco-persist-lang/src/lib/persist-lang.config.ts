import { InjectionToken, Provider } from '@angular/core';

export interface GetLangParams { cachedLang: string | null; browserLang?: string; cultureLang: string; defaultLang: string }

export interface PersistLangConfig {
  storage: Provider;
  storageKey?: string;
  getLangFn?(langs: GetLangParams): string;
}

export const TRANSLOCO_PERSIST_LANG_STORAGE = new InjectionToken('TRANSLOCO_PERSIST_LANG_STORAGE');
export const TRANSLOCO_PERSIST_LANG_CONFIG = new InjectionToken('TRANSLOCO_PERSIST_LANG_CONFIG');
