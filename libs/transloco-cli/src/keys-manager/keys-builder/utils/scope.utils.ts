import { Scopes } from '../../types';

let scopeToAlias: Scopes['scopeToAlias'] = {};
let aliasToScope: Scopes['aliasToScope'] = {};

export function addScope(scope: string, alias: string) {
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
