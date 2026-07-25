import { messages } from '../messages';
import { BaseParams } from '../types';
import { isFunction, isNil, isString } from '../utils/validators.utils';

interface AddKeysParams extends BaseParams {
  scopeAlias: string | null;
  keyWithoutScope: string;
  params?: string[];
}

export function addKey({
  defaultValue,
  scopeToKeys,
  scopeAlias,
  keyWithoutScope,
  scopes,
  params = [],
}: AddKeysParams) {
  if (!keyWithoutScope) {
    return;
  }

  const scopePath = scopeAlias && scopes.aliasToScope[scopeAlias];
  const keyWithScope = scopeAlias
    ? `${scopeAlias}.${keyWithoutScope}`
    : keyWithoutScope;
  const paramsWithInterpolation = params.map((p) => `{{${p}}}`).join(' ');

  const keyValue = isNil(defaultValue)
    ? `${messages.missingValue} '${keyWithScope}'`
    : defaultValue
        .replace('{{key}}', keyWithScope)
        .replace('{{keyWithoutScope}}', keyWithoutScope)
        .replace('{{params}}', paramsWithInterpolation)
        .replace('{{scope}}', scopeAlias || '');

  if (scopePath) {
    if (!scopeToKeys[scopePath]) {
      scopeToKeys[scopePath] = {};
    }
    scopeToKeys[scopePath][keyWithoutScope] = keyValue;
  } else {
    scopeToKeys.__global[keyWithoutScope] = keyValue;
  }
}
