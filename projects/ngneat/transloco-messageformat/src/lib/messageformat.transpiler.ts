import { Injectable, Inject, Optional } from '@angular/core';
import { DefaultTranspiler, HashMap, Translation, isObject, setValue, getValue } from '@ngneat/transloco';

import * as MessageFormat from 'messageformat';
import { MessageformatConfig, TRANSLOCO_MESSAGE_FORMAT_CONFIG } from './messageformat.config';

@Injectable()
export class MessageFormatTranspiler extends DefaultTranspiler {
  private messageFormat: MessageFormat;

  constructor(@Optional() @Inject(TRANSLOCO_MESSAGE_FORMAT_CONFIG) config: MessageformatConfig) {
    super();
    const { locales, ...messageConfig } = config || { locales: undefined };
    //@ts-ignore
    this.messageFormat = new MessageFormat(locales, messageConfig);
  }

  transpile(value: any, params: HashMap<any> = {}, translation: Translation): any {
    if (!value) {
      return value;
    }

    if (isObject(value) && params) {
      Object.keys(params).forEach(p => {
        const v = getValue(value as Object, p);
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
}
