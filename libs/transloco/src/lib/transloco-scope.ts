import { InjectionToken } from '@angular/core';

import { TranslocoScope } from './types';

export const TRANSLOCO_SCOPE =
  /* @__PURE__ */ new InjectionToken<TranslocoScope>(
    typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_SCOPE' : '',
  );
