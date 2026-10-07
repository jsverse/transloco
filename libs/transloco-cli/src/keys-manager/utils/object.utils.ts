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
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
