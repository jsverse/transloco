import { isObservable, from, of, Observable } from 'rxjs';
import { isFunction } from '@ngneat/transloco';

export function isPromise(v: any): v is Promise<any> {
  return v && isFunction(v.then);
}

export function observify(asyncOrValue: any): Observable<any> {
  if (isPromise(asyncOrValue) || isObservable(asyncOrValue)) {
    return from(asyncOrValue);
  }

  return of(asyncOrValue);
}
