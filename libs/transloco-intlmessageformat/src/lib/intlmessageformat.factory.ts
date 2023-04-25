import { MFLocale } from './intlmessageformat.config';

import IntlMessageFormat from 'intl-messageformat';
import { Formats, PrimitiveType } from 'intl-messageformat/src/formatters';
import { Options } from 'intl-messageformat/src/core';
import { MessageFormatElement } from '@formatjs/icu-messageformat-parser';

export type MFFactoryFn = (message: string | MessageFormatElement[], values?: Record<string, PrimitiveType>) => string | string[] | undefined;

export function defaultFactory(
    locales: MFLocale,
    formats?: Partial<Formats>,
    opts?: Options
): MFFactoryFn {
    return (message: string | MessageFormatElement[], values?: Record<string, PrimitiveType>) => {
        return new IntlMessageFormat(message, locales, formats, opts).format<string>(values);
    }
}

const cache = new Map<string, string | string[] | undefined>();

export function cachedFactory(
    locales: MFLocale,
    formats?: Partial<Formats>,
    opts?: Options
): MFFactoryFn {
    return (message: string | MessageFormatElement[], values?: Record<string, PrimitiveType>) => {
        const localeKey = `__${locales?.toString() || IntlMessageFormat.defaultLocale}__`;

        const cacheKey = `${localeKey}${values}`;
        const cachedMsg = cache.get(cacheKey);

        if (cachedMsg) {
            return cachedMsg;
        }

        const msg = defaultFactory(locales, formats, opts)(message, values);
        cache.set(cacheKey, msg);

        return msg;
    }
}
