import { InjectionToken } from '@angular/core';

export const TRANSLOCO_LANG = new InjectionToken<string>(
  ngDevMode ? 'TRANSLOCO_LANG' : '',
);
