import { InjectionToken } from '@angular/core';
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';

export const TRANSLOCO_MESSAGE_FORMAT_CONFIG =
  new InjectionToken<MessageformatConfig>('TRANSLOCO_MESSAGE_FORMAT_CONFIG');

export type MFLocale = ConstructorParameters<typeof MessageFormat>[0];

export interface MessageformatConfig extends MessageFormatOptions<'string'> {
  locales?: MFLocale;
  enableCache?: boolean;
  /**
   * @param missingParamHandling is used to handle missing parameters in translations.
   * 
   * undefined will return undefined instead of missing parameters, e.g. "some text {not_a_variable}" -> "some text undefined"
   * 'self' will return themselves instead of missing parameters, e.g. "some text {not_a_variable}" -> "some text {not_a_variable}"
   * 'empty' will return nothing instead of missing parameters, e.g. "some text {not_a_variable}" -> "some text "
  **/
  missingParamHandling?: 'self' | 'empty';
}
