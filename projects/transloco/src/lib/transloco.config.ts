import { InjectionToken } from '@angular/core';

export type TranslocoConfig = {
  runtime: boolean;
  defaultLang: string;
  prodMode: boolean;
};

export const TRANSLOCO_CONFIG = new InjectionToken('TRANSLOCO_CONFIG', {
  providedIn: 'root',
  factory: () => {
    return {};
  }
});

export const defaultConfig: TranslocoConfig = {
  runtime: true,
  defaultLang: 'en',
  prodMode: false
};
