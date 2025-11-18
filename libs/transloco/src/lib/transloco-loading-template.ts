import { InjectionToken } from '@angular/core';

import { Content } from './template-handler';

export const TRANSLOCO_LOADING_TEMPLATE =
  /* @__PURE__ */ new InjectionToken<Content>(
    ngDevMode ? 'TRANSLOCO_LOADING_TEMPLATE' : '',
  );
