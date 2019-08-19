import { Observable } from 'rxjs';

export type MaybeAsync<T = any> = Promise<T> | Observable<T> | T;

// TODO: Change to TranslocoStorage
export interface TranslocoPersistTranslationsTypes {
  getItem(key: string): MaybeAsync<any>;

  setItem(key: string, value: any): void;

  removeItem(key: string): void;
}
