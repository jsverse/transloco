import { isObject } from '@jsverse/utils';

import { Translation } from '../transloco.types';

export function flatten(obj: Translation): Translation {
  const result: Record<string, unknown> = {};

  function recurse(curr: unknown, prop: string) {
    if (curr === null) {
      result[prop] = null;
    } else if (isObject(curr)) {
      for (const [key, value] of Object.entries(curr)) {
        recurse(value, prop ? `${prop}.${key}` : key);
      }
    } else {
      result[prop] = curr;
    }
  }

  recurse(obj, '');
  return result;
}

export function unflatten(obj: Translation): Translation {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('.');
    let current = result;

    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        current[key] ??= {};
        current = current[key] as Record<string, unknown>;
      }
    });
  }

  return result;
}
