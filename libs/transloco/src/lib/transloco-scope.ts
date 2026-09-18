import { inject, InjectionToken } from '@angular/core';
import { OrArray } from '@jsverse/utils';

import { TranslocoScope } from './transloco.types';

export const TRANSLOCO_SCOPE = /* @__PURE__ */ new InjectionToken<
  OrArray<TranslocoScope>
>(typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_SCOPE' : '');

/** Resolves the provided `TRANSLOCO_SCOPE`, or `null` when not provided. */
export function injectTranslocoScope(): OrArray<TranslocoScope> | null {
  return inject(TRANSLOCO_SCOPE, { optional: true });
}
