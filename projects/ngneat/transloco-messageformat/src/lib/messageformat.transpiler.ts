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
  //@ts-ignore
  return wrapMfCompile(new MessageFormat(locales, messageConfig));
}

function wrapMfCompile(mf: MessageFormat): MessageFormat {
  const orgCompile: (messages: MessageFormat.SrcMessage, locale?: string) => MessageFormat.Msg = mf.compile;
  const cache: Map<string, MessageFormat.Msg> = new Map();

  mf.compile = function(messages: MessageFormat.SrcMessage, locale?: string): MessageFormat.Msg {
    const cacheKey: string | false = typeof messages === 'string' && `[__${locale || 'NO_LOCALE'}__],${messages}`;
    const cachedMsg: MessageFormat.Msg = cache.get(cacheKey);

    if (cachedMsg) {
      return cachedMsg;
    }

    const msg: MessageFormat.Msg = orgCompile.call(this, messages, locale);

    if (cacheKey) {
      cache.set(cacheKey, msg);
    }

    return msg;
  };

  return mf;
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

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: MFLocale) {
    this.messageFormat = mfFactory(locale, this.messageConfig);
  }
}
