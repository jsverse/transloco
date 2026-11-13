import { makeEnvironmentProviders } from '@angular/core';
import { TRANSLOCO_TRANSPILER } from '@jsverse/transloco';

import {
  IntlMessageFormatConfig,
  TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG,
} from './intlmessageformat.config';
import { IntlMessageFormatTranspiler } from './intlmessageformat.transpiler';

export function provideTranslocoIntlMessageFormat(
  config?: IntlMessageFormatConfig,
) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG, useValue: config },
    {
      provide: TRANSLOCO_TRANSPILER,
      useClass: IntlMessageFormatTranspiler,
    },
  ]);
}
