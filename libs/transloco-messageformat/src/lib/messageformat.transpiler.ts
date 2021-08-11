import { Inject, Injectable, Optional } from '@angular/core';
import {
  DefaultTranspiler,
  getValue,
  HashMap,
  isObject,
  setValue,
  Translation,
  TRANSLOCO_CONFIG,
  TranslocoConfig
} from '@ngneat/transloco';

import * as MessageFormat from 'messageformat';
import { MessageformatConfig, MFLocale, TRANSLOCO_MESSAGE_FORMAT_CONFIG } from './messageformat.config';

function mfFactory(locales?: MFLocale, messageConfig?: MessageFormat.Options): MessageFormat {
  return new MessageFormat(locales, messageConfig);
}

@Injectable()
export class MessageFormatTranspiler extends DefaultTranspiler {
  private messageFormat: MessageFormat;
  private messageConfig: MessageFormat.Options;

  constructor(
    @Optional() @Inject(TRANSLOCO_MESSAGE_FORMAT_CONFIG) config: MessageformatConfig,
    @Optional() @Inject(TRANSLOCO_CONFIG) userConfig?: TranslocoConfig
  ) {
    super(userConfig);
    const { locales, ...messageConfig } = config || { locales: undefined };
    this.messageConfig = messageConfig;
    this.messageFormat = mfFactory(locales, messageConfig);
  }

  transpile(value: any, params: HashMap<any> = {}, translation: Translation): any {
    if (!value) {
      return value;
    }

    if (isObject(value) && params) {
      Object.keys(params).forEach(p => {
        const v = getValue(value, p);
        const getParams = getValue(params, p);

        const transpiled = super.transpile(v, getParams, translation);
        const message = this.messageFormat.compile(transpiled);
        value = setValue(value, p, message(params[p]));
      });
    } else if (!Array.isArray(value)) {
      const transpiled = super.transpile(value, params, translation);

      const message = this.messageFormat.compile(transpiled);
      return message(params);
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: MFLocale) {
    this.messageFormat = mfFactory(locale, this.messageConfig);
  }
}
