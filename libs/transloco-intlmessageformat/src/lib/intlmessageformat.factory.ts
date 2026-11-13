import { Formats, IntlMessageFormat, Options } from 'intl-messageformat';

import { IMFLocale } from './intlmessageformat.config';

export type IMFCompiler = (message: string) => IntlMessageFormat;

export type IMFFactory = (
  locales: IMFLocale,
  formats?: Partial<Formats>,
  opts?: Options,
) => IMFCompiler;

export function defaultFactory(
  locales: IMFLocale,
  formats?: Partial<Formats>,
  opts?: Options,
): IMFCompiler {
  return (message) => new IntlMessageFormat(message, locales, formats, opts);
}

export function cachedFactory(
  locales: IMFLocale,
  formats?: Partial<Formats>,
  opts?: Options,
): IMFCompiler {
  const compile = defaultFactory(locales, formats, opts);
  const cache = new Map<string, IntlMessageFormat>();

  return (message) => {
    const cachedMsg = cache.get(message);

    if (cachedMsg) {
      return cachedMsg;
    }

    const msg = compile(message);
    cache.set(message, msg);

    return msg;
  };
}
