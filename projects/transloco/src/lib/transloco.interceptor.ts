import { InjectionToken } from '@angular/core';
import { Translation } from './types';

export const TRANSLOCO_INTERCEPTOR = new InjectionToken('TRANSLOCO_INTERCEPTOR');

export interface TranslocoInterceptor {
  preSaveTranslation(translation: Translation, lang: string): Translation;

  preSaveTranslationKey(key: string, value: string, lang: string): any;
}

export class DefaultInterceptor implements TranslocoInterceptor {
  preSaveTranslation(translation: Translation, lang: string): Translation {
    return translation;
  }

  preSaveTranslationKey(key: string, value: string, lang: string): any {
    return value;
  }

}
