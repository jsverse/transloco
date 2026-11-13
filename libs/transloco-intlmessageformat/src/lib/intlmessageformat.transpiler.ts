import { Injectable } from '@angular/core';
import { DefaultTranspiler, TranspileParams } from '@jsverse/transloco';
import { isObject, isString } from '@jsverse/utils';
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
import {
  placeholderMarker,
  placeholderName,
} from './intlmessageformat.placeholders';

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
      locales = this.config.defaultLang,
      formats,
      opts,
      enableCache = true,
    } = { ...this.imfConfigInput };
    this.formats = formats;
    this.opts = { ignoreTag: true, ...opts };
    this.imfFactory = enableCache ? cachedFactory : defaultFactory;
    this.compile = this.imfFactory(locales, this.formats, this.opts);
  }

  transpile({ value, params = {}, translation, key }: TranspileParams): any {
    if (!value) {
      return value;
    }

    if (Array.isArray(value)) {
      return this.handleArray({ value, params, translation, key });
    }

    if (isObject(value)) {
      return this.handleObject({
        value: value as Record<string, unknown>,
        params,
        translation,
        key,
      });
    }

    if (isString(value)) {
      return this.format({ value, params, translation, key });
    }

    return value;
  }

  onLangChanged(lang: string) {
    this.setLocale(lang);
  }

  setLocale(locale: IMFLocale) {
    this.compile = this.imfFactory(locale, this.formats, this.opts);
  }

  private format({
    value,
    params = {},
    translation,
    key,
  }: TranspileParams<string>) {
    const values: Record<string, unknown> = { ...params };
    let index = 0;
    const message = value.replace(this.interpolationMatcher, (placeholder) => {
      values[placeholderName(index)] = super.transpile({
        value: placeholder,
        params,
        translation,
        key,
      });

      return placeholderMarker(index++);
    });

    return this.compile(message).format(values);
  }
}
