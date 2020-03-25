import { NgModule, ModuleWithProviders } from '@angular/core';
import { TRANSLOCO_TRANSPILER } from '@ngneat/transloco';
import { MessageFormatTranspiler } from './messageformat.transpiler';
import { TRANSLOCO_MESSAGE_FORMAT_CONFIG, MessageformatConfig } from './messageformat.config';

/**
 * Transloco message format module
 * 
 * Adds support for ICU syntax translation using `messageformat.js`.
 */
@NgModule()
export class TranslocoMessageFormatModule {
  /**
   * Get a module that can be imported in the root application module
   * @param config Module configuration
   * @return Module
   */
  static forRoot(config?: MessageformatConfig): ModuleWithProviders {
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
  /**
   * Get a module that can be imported in the root application module
   * @param config Module configuration
   * @return Module
   * @deprecated Use `forRoot()` instead
   */
  static init(config?: MessageformatConfig): ModuleWithProviders {
    return TranslocoMessageFormatModule.forRoot(config);
  }
  constructor() {}
}
