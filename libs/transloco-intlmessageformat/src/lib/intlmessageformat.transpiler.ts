import { Injectable } from '@angular/core';
import {
  DefaultTranspiler,
  getValue,
  setValue,
  TranspileParams,
} from '@jsverse/transloco';
import { isObject } from '@jsverse/utils';
import { Formats, Options } from 'intl-messageformat';

import {
  IMFLocale,
  injectIntlMessageFormatConfig,
} from './intlmessageformat.config';
import {
  cachedFactory,
  defaultFactory,
  IMFCompiler,
  IMFFactory,
} from './intlmessageformat.factory';

@Injectable()
export class IntlMessageFormatTranspiler extends DefaultTranspiler {
  private readonly imfConfigInput = injectIntlMessageFormatConfig();
  private compile: IMFCompiler;
  private readonly formats?: Partial<Formats>;
  private readonly opts: Options;
  private readonly imfFactory: IMFFactory;

  constructor() {
    super();
    const {
      locales,
      formats,
      opts,
      enableCache = true,
    } = { ...this.imfConfigInput };
    this.formats = formats;
    this.opts = { ignoreTag: true, ...opts };
    this.imfFactory = enableCache ? cachedFactory : defaultFactory;
    this.compile = this.imfFactory(locales, this.formats, this.opts);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams) {
    if (!value) {
      return value;
    }

    if (isObject(value) && params) {
      Object.keys(params).forEach((p) => {
        const transpiled = super.transpile({
          value: getValue(value as Record<string, unknown>, p),
          params: getValue(params, p),
          translation,
          key,
        });
        value = setValue(value, p, this.compile(transpiled).format(params[p]));
      });
    } else if (!Array.isArray(value)) {
      const transpiled = super.transpile({ value, params, translation, key });

      return this.compile(transpiled).format(params);
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: IMFLocale) {
    this.compile = this.imfFactory(locale, this.formats, this.opts);
  }
}
