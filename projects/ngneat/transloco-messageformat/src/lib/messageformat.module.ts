import { NgModule, ModuleWithProviders } from '@angular/core';
import { TRANSLOCO_TRANSPILER } from '@ngneat/transloco';
import { MessageFormatTranspiler } from './messageformat.transpiler';
import { TRANSLOCO_MESSAGE_FORMAT_CONFIG, MessageformatConfig } from './messageformat.config';

export function translocoMessageFormatFactory(config: MessageformatConfig) {
  return new MessageFormatTranspiler(config);
}

@NgModule({
  providers: [
    {
      provide: TRANSLOCO_TRANSPILER,
      useClass: MessageFormatTranspiler
    }
  ]
})
export class TranslocoMessageFormatModule {
  static init(config: MessageformatConfig): ModuleWithProviders {
    return {
      ngModule: TranslocoMessageFormatModule,
      providers: [
        { provide: TRANSLOCO_MESSAGE_FORMAT_CONFIG, useValue: config },
        {
          provide: TRANSLOCO_TRANSPILER,
          useClass: MessageFormatTranspiler
        }
      ]
    };
  }

  constructor() {}
}
