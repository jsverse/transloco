import { LiteralPrimitive } from '@angular/compiler';

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
 *  scopePath: 'some/nested/unknown' => undefined
 *
 */
export function resolveScopeAlias({
  scopePath,
  scopes,
  langs,
}: {
  scopePath: string;
  scopes: Scopes;
  langs: string[];
}) {
  const scopeAlias = scopes.scopeToAlias[scopePath];
  if (scopeAlias) {
    return scopeAlias;
  }

  // Otherwise we're probably have a language in the scope: some/nested/en
  const splitted = scopePath.split('/');
  const maybeLang = splitted.at(-1) ?? '';

  // Only a configured language may be stripped, otherwise we'd resolve an
  // unrelated path such as 'some/nested/deep' to the 'some/nested' scope.
  if (!langs.includes(maybeLang)) {
    return undefined;
  }

  splitted.pop();

  const scopePathWithoutLang = splitted.join('/');
  return scopePathWithoutLang
    ? scopes.scopeToAlias[scopePathWithoutLang]
    : undefined;
}
