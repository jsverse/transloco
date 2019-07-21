import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type Lang = { [key: string]: any };

export type Loader = (lang: string) => () => Observable<Lang> | Promise<Lang> | Lang;
export const TRANSLOCO_LOADER = new InjectionToken<Loader>('TRANSLOCO_LOADER');
