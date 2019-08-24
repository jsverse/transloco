import { isObservable, from, of, Observable } from 'rxjs';
import { isFunction } from '../../../transloco/src/lib/helpers';

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
