import { InjectionToken } from '@angular/core';

import { TranslocoScope } from './transloco.types';

export const TRANSLOCO_SCOPE =
  /* @__PURE__ */ new InjectionToken<TranslocoScope>(
    typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_SCOPE' : '',
  );
