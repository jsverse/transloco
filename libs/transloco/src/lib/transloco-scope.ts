import { InjectionToken } from '@angular/core';

import { TranslocoScope } from './types';

export const TRANSLOCO_SCOPE = new InjectionToken<TranslocoScope>(
  typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_SCOPE' : '',
);
