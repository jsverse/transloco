import { NgModule, ModuleWithProviders } from '@angular/core';
import { TRANSLOCO_TRANSPILER } from '@ngneat/transloco';
import { IntlMessageFormatTranspiler } from './intlmessageformat.transpiler';
import {
    TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG,
    IntlMessageFormatConfig,
} from './intlmessageformat.config';

@NgModule()
export class TranslocoIntlMessageFormatModule {
    static forRoot(
        config?: IntlMessageFormatConfig
    ): ModuleWithProviders<TranslocoIntlMessageFormatModule> {
        return {
            ngModule: TranslocoIntlMessageFormatModule,
            providers: [
                {provide: TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG, useValue: config},
                {
                    provide: TRANSLOCO_TRANSPILER,
                    useClass: IntlMessageFormatTranspiler,
                },
            ],
        };
    }
}
