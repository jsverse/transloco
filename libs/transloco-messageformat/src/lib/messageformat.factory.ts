import MessageFormat, {
  MessageFormatOptions,
  MessageFunction,
} from '@messageformat/core';

import { MFLocale } from './messageformat.config';

export type MFFactory = (
  locales: MFLocale,
  messageConfig: MessageFormatOptions<'string'>,
) => MessageFormat;

export function defaultFactory(
  locales: MFLocale,
  messageConfig: MessageFormatOptions<'string'>,
): MessageFormat {
  return new MessageFormat<'string'>(locales, messageConfig);
}

export function cachedFactory(
  locales: MFLocale,
  messageConfig: MessageFormatOptions<'string'>,
): MessageFormat {
  const mf = defaultFactory(locales, messageConfig);
  const original = mf.compile;
  const cache = new Map<string, MessageFunction<'string'>>();
  const localeKey = `__${locales?.toString() || MessageFormat.defaultLocale}__`;

  mf.compile = function (messages: string): MessageFunction<'string'> {
    const cacheKey = `${localeKey}${messages}`;
    const cachedMsg = cache.get(cacheKey);

    if (cachedMsg) {
      return cachedMsg;
    }

    const msg = original.call(this, messages);
    cache.set(cacheKey, msg);

    return msg;
  };

  return mf;
}
