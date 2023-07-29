import { makeEnvironmentProviders } from '@angular/core';
import { TRANSLOCO_TRANSPILER } from '@ngneat/transloco';

import {
  MessageformatConfig,
  TRANSLOCO_MESSAGE_FORMAT_CONFIG,
} from './messageformat.config';
import { MessageFormatTranspiler } from './messageformat.transpiler';

export function provideTranslocoMessageformat(config?: MessageformatConfig) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_MESSAGE_FORMAT_CONFIG, useValue: config },
    {
      provide: TRANSLOCO_TRANSPILER,
      useClass: MessageFormatTranspiler,
    },
  ]);
}
