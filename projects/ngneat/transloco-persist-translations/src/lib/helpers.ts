import { isObservable, from, of, Observable } from 'rxjs';

export function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function isObject(item): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function isPromise(v: any) {
  return v && isFunction(v.then);
}

export function observify<T>(asyncOrValue: any): Observable<T> {
  if (isPromise(asyncOrValue) || isObservable(asyncOrValue)) {
    return from(asyncOrValue);
  }

  return of(asyncOrValue);
}

export function now(): number {
  return new Date().getTime();
}
