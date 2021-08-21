import { Observable } from 'rxjs';

export type MaybeAsync<T = any> = Promise<T> | Observable<T> | T;

export interface MaybeAsyncStorage {
  getItem(key: string): MaybeAsync;

  setItem(key: string, value: any): void;

  removeItem(key: string): void;
}
