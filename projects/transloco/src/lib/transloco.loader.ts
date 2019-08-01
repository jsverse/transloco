import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type Translation = { [key: string]: any };

export type TranslocoLoader = (lang: string) => () => Observable<Translation> | Promise<Translation> | Translation;
export const TRANSLOCO_LOADER = new InjectionToken<TranslocoLoader>('TRANSLOCO_LOADER');
