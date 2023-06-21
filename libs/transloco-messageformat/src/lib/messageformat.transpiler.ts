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
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';

import {
  MessageformatConfig,
  MFLocale,
  TRANSLOCO_MESSAGE_FORMAT_CONFIG,
} from './messageformat.config';
import {
  cachedFactory,
  defaultFactory,
  MFFactory,
} from './messageformat.factory';

const REG_EXP_FOR_MISSING_PARAMS = /\{\w*\}/g;

@Injectable()
export class MessageFormatTranspiler extends DefaultTranspiler {
  private messageFormat: MessageFormat;
  private readonly messageConfig: MessageFormatOptions<'string'>;
  private readonly mfFactory: MFFactory;

  constructor(
    @Optional()
    @Inject(TRANSLOCO_MESSAGE_FORMAT_CONFIG)
    private readonly config: MessageformatConfig,
    @Optional() @Inject(TRANSLOCO_CONFIG) userConfig?: TranslocoConfig
  ) {
    super(userConfig);
    const {
      locales,
      enableCache = true,
      ...messageConfig
    } = { locales: null, ...config };
    this.messageConfig = messageConfig;
    this.mfFactory = enableCache ? cachedFactory : defaultFactory;
    this.messageFormat = this.mfFactory(locales, messageConfig);
  }

  transpile(value: any, params: HashMap = {}, translation: Translation, key: string): any {
    if (!value) {
      return value;
    }    
    if (isObject(value) && params) {
      Object.keys(params).forEach((p) => {
        const v = getValue(value, p);
        const getParams = getValue(params, p);
        const transpiled = super.transpile(v, getParams, translation, key);
        const handledParams = this.config.missingParamHandling ? this.handleMissingParams(transpiled, params, this.config.missingParamHandling) : params;
        const message = this.messageFormat.compile(transpiled);
        value = setValue(value, p, message(handledParams[p]));
      });
    } else if (!Array.isArray(value)) {
      const transpiled = super.transpile(value, params, translation, key);
      const handledParams = this.config.missingParamHandling ? this.handleMissingParams(transpiled, params, this.config.missingParamHandling) : params;

      const message = this.messageFormat.compile(transpiled);
      return message(handledParams);
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: MFLocale) {
    this.messageFormat = this.mfFactory(locale, this.messageConfig);
  }
  
  private handleMissingParams(transpiled: any, params: HashMap, missingParamHandling: 'self' | 'empty'): HashMap {
    const paramsFromTranslation: string[] = transpiled.match(REG_EXP_FOR_MISSING_PARAMS) ?? [];

    return paramsFromTranslation.reduce((handledParams, paramFromTranslation) => {
      // remove curly brackets
      const keyWithoutBraces = paramFromTranslation.slice(1, -1);

      return {
        ...handledParams,
        [keyWithoutBraces]: missingParamHandling === 'self' ? paramFromTranslation : '',
      };
    }, params);
  }
}
