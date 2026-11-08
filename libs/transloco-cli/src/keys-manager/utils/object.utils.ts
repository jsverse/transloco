import { getConfig } from '../config';

import { isObject } from './validators.utils';

export function stringify(val: object) {
  const { sort } = getConfig();
  let value = val;

  if (sort) {
    value = sortKeys(val);
  }

  return JSON.stringify(value, null, 2);
}

function sortKeys(val: Record<string, any>) {
  return Object.keys(val)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = isObject(val[key]) ? sortKeys(val[key]) : val[key];
        return acc;
      },
      {} as Record<string, any>,
    );
}

export function mergeDeep(target: object, ...sources: any[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      // A JSON-parsed `__proto__` is an own key, but assigning or reading it
      // on the target would reach Object.prototype.
      if (key === '__proto__') continue;

      if (isObject(source[key])) {
        // Ignore inherited members (e.g. `constructor`) so they become own keys
        if (!Object.hasOwn(target, key) || !target[key]) {
          Object.assign(target, { [key]: {} });
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
