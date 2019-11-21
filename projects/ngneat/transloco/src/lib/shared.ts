import { TranslocoService } from './transloco.service';
import { hasInlineLoader, isString } from './helpers';
import { take } from 'rxjs/operators';
import { InlineLoader, TranslocoScope } from './types';

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
  const split = lang.split('/');
  return split.pop();
}

/**
 * @example
 *
 * getPipeValue('todos|scoped', 'scoped') [true, 'todos']
 * getPipeValue('en|static', 'static') [true, 'en']
 * getPipeValue('en', 'static') [false, 'en']
 */
export function getPipeValue(str: string, value: string, char = '|'): [boolean, string] {
  if (isString(str)) {
    const splitted = str.split(char);
    const lastItem = splitted.pop();
    return lastItem === value ? [true, splitted.toString()] : [false, lastItem];
  }

  return [false, ''];
}

export function shouldListenToLangChanges(service: TranslocoService, lang: string) {
  const [hasStatic] = getPipeValue(lang, 'static');
  if (hasStatic === false) {
    // If we didn't get 'lang|static' check if it's set in the global level
    return service.config.reRenderOnLangChange;
  }

  // We have 'lang|static' so don't listen to lang changes
  return false;
}

export function listenOrNotOperator(listenToLangChange: boolean) {
  return listenToLangChange ? source => source : take(1);
}

function prependScope(inlineLoader, scope) {
  return Object.keys(inlineLoader).reduce((acc, lang) => {
    acc[`${scope}/${lang}`] = inlineLoader[lang];
    return acc;
  }, {});
}

export function resolveInlineLoader(providerScope: TranslocoScope | null, scope: string): InlineLoader | null {
  return hasInlineLoader(providerScope) ? prependScope(providerScope.loader, scope) : null;
}

export function getEventPayload(lang: string) {
  return {
    scope: getScopeFromLang(lang) || null,
    langName: getLangFromScope(lang),
    lang
  };
}
