import { from, isObservable, Observable, of } from 'rxjs';
import { isFunction } from '@jsverse/utils';

export function isPromise(value: any): value is PromiseLike<unknown> {
  return isFunction(value?.then);
}

export function observify<T>(
  asyncOrValue: PromiseLike<T> | Observable<T> | T,
): Observable<T> {
  if (isPromise(asyncOrValue) || isObservable(asyncOrValue)) {
    return from(asyncOrValue);
  }

  return of(asyncOrValue);
}
