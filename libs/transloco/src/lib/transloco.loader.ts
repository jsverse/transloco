import { inject, InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Translation } from './transloco.types';

export interface TranslocoLoader {
  getTranslation(
    lang: string,
    data?: TranslocoLoaderData,
  ): Observable<Translation> | Promise<Translation>;
}

export type TranslocoLoaderData = {
  scope: string;
};

export class DefaultLoader implements TranslocoLoader {
  constructor(private translations: Map<string, Translation>) {}

  getTranslation(lang: string): Observable<Translation> {
    return of(this.translations.get(lang) || {});
  }
}

export const TRANSLOCO_LOADER =
  /* @__PURE__ */ new InjectionToken<TranslocoLoader>(
    typeof ngDevMode !== 'undefined' && ngDevMode ? 'TRANSLOCO_LOADER' : '',
  );

/**
 * Resolves the provided `TRANSLOCO_LOADER`, falling back to a `DefaultLoader`
 * backed by `translations` when no loader was provided.
 */
export function injectLoader(
  translations: Map<string, Translation>,
): TranslocoLoader {
  return (
    inject(TRANSLOCO_LOADER, { optional: true }) ??
    new DefaultLoader(translations)
  );
}
