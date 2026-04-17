import { isObject } from '@jsverse/utils';

import {
  InlineLoader,
  LoadedEvent,
  ProviderScope,
  TranslocoScope,
} from '../transloco.types';

/*
 * @example
 *
 * given: lazy-page/en => lazy-page
 *
 */
export function getScopeFromLang(lang: string): string {
  if (!lang) {
    return '';
  }

  const split = lang.split('/');
  split.pop();

  return split.join('/');
}

/*
 * @example
 *
 * given: lazy-page/en => en
 *
 */
export function getLangFromScope(lang: string): string {
  if (!lang) {
    return '';
  }

  return lang.split('/').pop()!;
}

function prependScope(inlineLoader: InlineLoader, scope: string) {
  return Object.keys(inlineLoader).reduce(
    (acc, lang) => {
      acc[`${scope}/${lang}`] = inlineLoader[lang];

      return acc;
    },
    {} as Record<string, InlineLoader[keyof InlineLoader]>,
  );
}

export function isScopeObject(item: any): item is ProviderScope {
  return typeof item?.scope === 'string';
}

export function hasInlineLoader(item: any): item is ProviderScope {
  return item?.loader && isObject(item.loader);
}

export function resolveInlineLoader(
  providerScope: TranslocoScope | null,
  scope?: string,
): InlineLoader | undefined {
  return hasInlineLoader(providerScope)
    ? prependScope(providerScope.loader!, scope!)
    : undefined;
}

export function getEventPayload(lang: string): LoadedEvent['payload'] {
  return {
    scope: getScopeFromLang(lang) || null,
    langName: getLangFromScope(lang),
  };
}
