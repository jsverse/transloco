import { LiteralPrimitive } from '@angular/compiler';

import { getConfig } from '../../config';
import { Scopes } from '../../types';
import { isString } from '../../utils/validators.utils';

export function resolveAliasAndKey(
  key: LiteralPrimitive['value'],
  scopes: Scopes,
): [string, string | null] {
  /**
   *
   * It can be one of the following:
   *
   * {{ 'title' | transloco }}
   *
   * {{ 'scopeAlias.title' | transloco }}
   *
   */
  if (!isString(key)) return ['', null];
  const [scopeAliasOrKey, ...actualKey] = key.split('.');
  const scopeAliasExists = Object.prototype.hasOwnProperty.call(
    scopes.aliasToScope,
    scopeAliasOrKey,
  );
  const translationKey = scopeAliasExists ? actualKey.join('.') : key;

  return [translationKey, scopeAliasExists ? scopeAliasOrKey : null];
}

/**
 *
 * Resolve the scope alias
 *
 * @example
 *
 *  scopePath: 'some/nested' => someNested
 *  scopePath: 'some/nested/en' => someNested
 *
 */
export function resolveScopeAlias({
  scopePath,
  scopes,
}: {
  scopePath: string;
  scopes: Scopes;
}) {
  const scopeAlias = scopes.scopeToAlias[scopePath];
  if (scopeAlias) {
    return scopeAlias;
  }

  // Otherwise we're probably have a language in the scope: some/nested/en
  const splitted = scopePath.split('/');
  const lastSegment = splitted[splitted.length - 1];

  // Only remove the last segment if it's actually a configured language,
  // otherwise it's part of the scope path itself.
  if (!getConfig().langs.includes(lastSegment)) {
    return undefined;
  }

  // Remove the lang
  splitted.pop();

  const scopePathWithoutLang = splitted.join('/');
  return scopePathWithoutLang && scopes.scopeToAlias[scopePathWithoutLang];
}
