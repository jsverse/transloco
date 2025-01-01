import { InjectionToken } from '@angular/core';

export const TRANSLOCO_LANG = new InjectionToken<string>(
  typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_LANG' : '',
);
