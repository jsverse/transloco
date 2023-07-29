import { InjectionToken } from '@angular/core';
import { PersistStorage } from './persist-lang.types';

export interface GetLangParams {
  cachedLang: string | null;
  browserLang?: string;
  cultureLang: string;
  defaultLang: string;
}

export interface PersistLangConfig {
  storageKey?: string;
  getLangFn?(langs: GetLangParams): string;
}

export const TRANSLOCO_PERSIST_LANG_STORAGE =
  new InjectionToken<PersistStorage>('TRANSLOCO_PERSIST_LANG_STORAGE');

export const TRANSLOCO_PERSIST_LANG_CONFIG =
  new InjectionToken<PersistLangConfig>('TRANSLOCO_PERSIST_LANG_CONFIG');
