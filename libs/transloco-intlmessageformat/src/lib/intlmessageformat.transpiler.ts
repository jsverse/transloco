import { Inject, Injectable, Optional } from '@angular/core';
import {
    DefaultTranspiler,
    getValue,
    HashMap,
    isObject,
    setValue,
    Translation,
    TRANSLOCO_CONFIG,
    TranslocoConfig,
} from '@ngneat/transloco';

import {
    IntlMessageFormatConfig,
    MFLocale,
    TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG,
} from './intlmessageformat.config';
import {
    cachedFactory,
    defaultFactory,
    MFFactoryFn,
} from './intlmessageformat.factory';

@Injectable()
export class IntlMessageFormatTranspiler extends DefaultTranspiler {
    private config: IntlMessageFormatConfig;

    private mfFactory: MFFactoryFn;

    constructor(
        @Inject(TRANSLOCO_INTL_MESSAGE_FORMAT_CONFIG) config: IntlMessageFormatConfig,
        @Optional() @Inject(TRANSLOCO_CONFIG) userConfig?: TranslocoConfig
    ) {
        super(userConfig);

        this.config = config;
        this.mfFactory = this.getMFFactory(config.locales);
    }

    override transpile(value: any, params: HashMap = {}, translation: Translation, key: string): any {
        if (!value) {
            return value;
        }
        if (isObject(value) && params) {
            Object.keys(params).forEach((p) => {
                const v = getValue(value, p);
                const getParams = getValue(params, p);
                const transpiled = super.transpile(v, getParams, translation, key);
                const message = this.mfFactory(transpiled, getParams);
                value = setValue(value, p, message);
            });
        } else if (!Array.isArray(value)) {
            const transpiled = super.transpile(value, params, translation, key);

            return this.mfFactory(transpiled, params);
        }

        return value;
    }

    onLangChanged(lang: string) {
        this.mfFactory = this.getMFFactory(lang);
    }

    private getMFFactory(locales: string | string[] | undefined): MFFactoryFn {
        return this.config.enableCache ?
            cachedFactory(locales, this.config.formats, this.config.opts) :
            defaultFactory(locales, this.config.formats, this.config.opts);
    }

}
