import { InjectionToken } from '@angular/core';

import * as MessageFormat from 'messageformat';
import { HashMap } from '@ngneat/transloco';
import { Locale } from '@ngneat/transloco-locale';

export const TRANSLOCO_MESSAGE_FORMAT_CONFIG = new InjectionToken<MessageformatConfig>(
  'TRANSLOCO_MESSAGE_FORMAT_CONFIG'
);

export type MFLocale = { [locale: string]: Function } | string[] | string;

export interface MessageformatConfig extends MessageFormat.Options {
  locales?: MFLocale;
  langToLocaleMapping?: HashMap<Locale>;
}
