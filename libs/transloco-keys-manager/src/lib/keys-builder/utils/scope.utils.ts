import { Scopes } from '../../types';

let scopeToAlias: Scopes['scopeToAlias'] = {};
let aliasToScope: Scopes['aliasToScope'] = {};

export function addScope(scope: string, alias: string) {
  // Keep the maps bijective, an overwritten scope or alias must not leave a
  // stale reverse entry behind.
  const previousAlias = scopeToAlias[scope];
  if (previousAlias !== undefined) {
    delete aliasToScope[previousAlias];
  }

  const previousScope = aliasToScope[alias];
  if (previousScope !== undefined) {
    delete scopeToAlias[previousScope];
  }

  scopeToAlias[scope] = alias;
  aliasToScope[alias] = scope;
}

export function getScopes() {
  return { scopeToAlias, aliasToScope };
}

export function hasScope(scope: string) {
  return Object.prototype.hasOwnProperty.call(scopeToAlias, scope);
}

export function resetScopes() {
  scopeToAlias = {};
  aliasToScope = {};
}
