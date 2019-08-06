import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Translation } from './types';

export interface TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> | Promise<Translation>;
}

export const TRANSLOCO_LOADER = new InjectionToken<Translation>('TRANSLOCO_LOADER');
