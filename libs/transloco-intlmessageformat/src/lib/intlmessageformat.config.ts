import { inject, InjectionToken } from '@angular/core';
import { Formats, IntlMessageFormat, Options } from 'intl-messageformat';

export const TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG =
  /* @__PURE__ */ new InjectionToken<IntlMessageFormatConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG'
      : '',
  );

/**
 * There's no default value for this token, so it's optional and may
 * resolve to `null` when no config is provided.
 */
export function injectIntlMessageFormatConfig() {
  return inject(TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG, { optional: true });
}

export type IMFLocale = ConstructorParameters<typeof IntlMessageFormat>[1];

export interface IntlMessageFormatConfig {
  locales?: IMFLocale;
  formats?: Partial<Formats>;
  opts?: Options;
  enableCache?: boolean;
}
