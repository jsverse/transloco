import { inject, InjectionToken } from '@angular/core';

export const TRANSLOCO_LANG = /* @__PURE__ */ new InjectionToken<string>(
  typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_LANG' : '',
);

/** Resolves the provided `TRANSLOCO_LANG`, or `null` when not provided. */
export function injectTranslocoLang(): string | null {
  return inject(TRANSLOCO_LANG, { optional: true });
}
