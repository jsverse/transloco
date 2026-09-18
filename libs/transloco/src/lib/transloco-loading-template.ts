import { inject, InjectionToken } from '@angular/core';

import { Content } from './template-handler';

export const TRANSLOCO_LOADING_TEMPLATE =
  /* @__PURE__ */ new InjectionToken<Content>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_LOADING_TEMPLATE'
      : '',
  );

/** Resolves the provided `TRANSLOCO_LOADING_TEMPLATE`, or `null` when not provided. */
export function injectLoadingTemplate(): Content | null {
  return inject(TRANSLOCO_LOADING_TEMPLATE, { optional: true });
}
