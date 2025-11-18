import { Injectable, InjectionToken } from '@angular/core';

import { Translation } from './transloco.types';

export const TRANSLOCO_INTERCEPTOR =
  /* @__PURE__ */ new InjectionToken<TranslocoInterceptor>(
    ngDevMode ? 'TRANSLOCO_INTERCEPTOR' : '',
  );

export interface TranslocoInterceptor {
  preSaveTranslation(translation: Translation, lang: string): Translation;

  preSaveTranslationKey(key: string, value: string, lang: string): string;
}

@Injectable()
export class DefaultInterceptor implements TranslocoInterceptor {
  preSaveTranslation(translation: Translation): Translation {
    return translation;
  }

  preSaveTranslationKey(_: string, value: string): string {
    return value;
  }
}
