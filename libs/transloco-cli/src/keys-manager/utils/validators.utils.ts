import { existsSync, lstatSync } from 'fs';

export function isObject(value: any): value is Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isNil(value: unknown): value is undefined | null {
  return isUndefined(value) || value === null;
}

export function notNil<T>(value: T | undefined | null): value is T {
  return !isNil(value);
}

export function isDirectory(path: string): boolean {
  return existsSync(path) && lstatSync(path).isDirectory();
}

export function isString(value: any): value is string {
  return value && typeof value === 'string';
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}
