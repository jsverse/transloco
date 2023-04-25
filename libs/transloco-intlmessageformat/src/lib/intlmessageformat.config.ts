import { InjectionToken } from '@angular/core';

import IntlMessageFormat from 'intl-messageformat';
import { Formats } from 'intl-messageformat/src/formatters';
import { Options } from 'intl-messageformat/src/core';

export const TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG =
    new InjectionToken<IntlMessageFormatConfig>('TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG');

export type MFLocale = ConstructorParameters<typeof IntlMessageFormat>[1];

export interface IntlMessageFormatConfig {
    locales?: MFLocale;
    formats?: Partial<Formats>
    opts?: Options,
    enableCache?: boolean;
}
