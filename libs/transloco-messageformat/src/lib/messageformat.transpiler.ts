import { Inject, Injectable, Optional } from '@angular/core';
import {
  DefaultTranspiler,
  getValue,
  setValue,
  TranspileParams,
} from '@jsverse/transloco';
import { isObject } from '@jsverse/utils';
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

@Injectable()
export class MessageFormatTranspiler extends DefaultTranspiler {
  private messageFormat: MessageFormat;
  private readonly messageConfig: MessageFormatOptions<'string'>;
  private readonly mfFactory: MFFactory;
  // MessageFormat instances keyed by language, so a string is compiled with its
  // own language's plural/select rules and not the active language's (#528).
  private readonly messageFormatByLang = new Map<string, MessageFormat>();

  constructor(
    @Optional()
    @Inject(TRANSLOCO_MESSAGE_FORMAT_CONFIG)
    config: MessageformatConfig,
  ) {
    super();
    const {
      locales,
      enableCache = true,
      ...messageConfig
    } = { locales: null, ...config };
    this.messageConfig = messageConfig;
    this.mfFactory = enableCache ? cachedFactory : defaultFactory;
    this.messageFormat = this.mfFactory(locales, messageConfig);
  }

  transpile({ value, params = {}, translation, key, lang }: TranspileParams) {
    if (!value) {
      return value;
    }

    const messageFormat = this.resolveMessageFormat(lang);

    if (isObject(value) && params) {
      Object.keys(params).forEach((p) => {
        const transpiled = super.transpile({
          value: getValue(value as Record<string, unknown>, p),
          params: getValue(params, p),
          translation,
          key,
          lang,
        });
        const message = messageFormat.compile(transpiled);
        value = setValue(value, p, message(params[p]));
      });
    } else if (!Array.isArray(value)) {
      const transpiled = super.transpile({
        value,
        params,
        translation,
        key,
        lang,
      });

      const message = messageFormat.compile(transpiled);
      return message(params);
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: MFLocale) {
    this.messageFormat = this.mfFactory(locale, this.messageConfig);
  }

  private resolveMessageFormat(lang: string | undefined): MessageFormat {
    if (!lang) {
      return this.messageFormat;
    }

    let messageFormat = this.messageFormatByLang.get(lang);
    if (!messageFormat) {
      messageFormat = this.mfFactory(lang, this.messageConfig);
      this.messageFormatByLang.set(lang, messageFormat);
    }

    return messageFormat;
  }
}
