import { InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Translation } from './types';

export interface TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> | Promise<Translation>;
}

export class DefaultLoader implements TranslocoLoader {
  constructor(private translations: Map<string, Translation>) {}

  getTranslation(lang: string): Observable<Translation> {
    return of(this.translations.get(lang) || {});
  }
}

export const TRANSLOCO_LOADER = new InjectionToken<Translation>('TRANSLOCO_LOADER');
