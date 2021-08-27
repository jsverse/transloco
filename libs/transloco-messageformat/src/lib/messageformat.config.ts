import { InjectionToken } from '@angular/core';

import * as MessageFormat from 'messageformat';

export const TRANSLOCO_MESSAGE_FORMAT_CONFIG =
  new InjectionToken<MessageformatConfig>('TRANSLOCO_MESSAGE_FORMAT_CONFIG');

type Locale = string;
export type MFLocale = Record<Locale, Function> | string[] | string;

export interface MessageformatConfig extends MessageFormat.Options {
  locales?: MFLocale;
}
