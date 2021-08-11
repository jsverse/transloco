import { ProviderScope, Translation } from './types';
import {flatten as _flatten, unflatten as _unflatten} from 'flat';

export function getValue<T extends object>(obj: T, path: keyof T) {
  /* For cases where the key is like: 'general.something.thing' */
  if (obj?.hasOwnProperty(path)) {
    return obj[path];
  }

  return (path as string).split('.').reduce((p, c) => p?.[c], obj as any);
}

export function setValue(obj: any, prop: string, val: any) {
  obj = { ...obj };

  const split = prop.split('.');
  const lastIndex = split.length - 1;

  split.reduce((acc, part, index) => {
    if (index === lastIndex) {
      acc[part] = val;
    } else {
      acc[part] = Array.isArray(acc[part]) ? acc[part].slice() : { ...acc[part] };
    }

    return acc && acc[part];
  }, obj);

  return obj;
}

export function size(collection: any): number {
  if (!collection) {
    return 0;
  }

  if (Array.isArray(collection)) {
    return collection.length;
  }

  if (isObject(collection)) {
    return Object.keys(collection).length;
  }

  return !!collection ? collection.length : 0;
}

export function isEmpty(collection: any): boolean {
  return size(collection) === 0;
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function isNumber(val: any): val is number {
  return typeof val === 'number';
}

export function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function coerceArray<T>(val: T): T[] {
  return Array.isArray(val) ? val : [val];
}

/*
 * @example
 *
 * given: path-to-happiness => pathToHappiness
 * given: path_to_happiness => pathToHappiness
 * given: path-to_happiness => pathToHappiness
 *
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index == 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+|_|-|\//g, '');
}

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function isDefined(value: any) {
  return isNil(value) === false;
}

export function toNumber(value: number | string): number | null {
  if (isNumber(value)) return value;

  if (isString(value) && !isNaN(Number(value) - parseFloat(value))) {
    return Number(value);
  }

  return null;
}

export function isScopeObject(item: any): item is ProviderScope {
  return item && typeof item.scope === 'string';
}

export function hasInlineLoader(item: any): item is ProviderScope {
  return item && isObject(item.loader);
}

export function unflatten(obj: Translation): Translation {
  return _unflatten(obj);
}

export function flatten(obj: Translation): Translation {
  return _flatten(obj, { safe: true });
}
