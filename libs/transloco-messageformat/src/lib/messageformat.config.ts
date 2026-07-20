import { InjectionToken } from '@angular/core';
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';

export const TRANSLOCO_MESSAGE_FORMAT_CONFIG =
  /* @__PURE__ */ new InjectionToken<MessageformatConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_MESSAGE_FORMAT_CONFIG'
      : '',
  );

export type MFLocale = ConstructorParameters<typeof MessageFormat>[0];

export interface MessageformatConfig extends MessageFormatOptions<'string'> {
  locales?: MFLocale;
  enableCache?: boolean;
}
