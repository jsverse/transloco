import { InjectionToken } from '@angular/core';
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';

export const TRANSLOCO_MESSAGE_FORMAT_CONFIG =
  new InjectionToken<MessageformatConfig>('TRANSLOCO_MESSAGE_FORMAT_CONFIG');

export type MFLocale = ConstructorParameters<typeof MessageFormat>[0];

export interface MessageformatConfig extends MessageFormatOptions<'string'> {
  locales?: MFLocale;
}
