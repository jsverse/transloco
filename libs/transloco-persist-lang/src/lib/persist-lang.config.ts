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
  /* @__PURE__ */ new InjectionToken<PersistStorage>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_PERSIST_LANG_STORAGE'
      : '',
  );

export const TRANSLOCO_PERSIST_LANG_CONFIG =
  /* @__PURE__ */ new InjectionToken<PersistLangConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_PERSIST_LANG_CONFIG'
      : '',
  );
