import { InjectionToken } from '@angular/core';

export type TranslocoConfig = {
  runtime: boolean;
};

export const TRANSLOCO_CONFIG = new InjectionToken('TRANSLOCO_CONFIG', {
  providedIn: 'root',
  factory: () => {
    return {};
  }
});

export const defaults: TranslocoConfig = {
  runtime: true
};
