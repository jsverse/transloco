import { of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { MaybeAsyncStorage } from '../transloco.storage';

export function createLoaderMock(translations: Record<string, string>) {
  return class MockLoader {
    getTranslation() {
      return of(translations);
    }
  };
}

export function createStorageMock() {
  return class Storage implements MaybeAsyncStorage {
    storage: Record<string, any> = {};
    getItem(key: string) {
      return this.storage[key];
    }

    setItem(key: string, value: any): void {
      this.storage[key] = value + '';
    }

    removeItem(key: string): void {
      delete this.storage[key];
    }
  };
}

export function createAsyncLoaderMock(
  delay: number,
  translations: Record<string, string>,
) {
  return class MockLoader {
    getTranslation() {
      return timer(delay).pipe(map(() => translations));
    }
  };
}

export function createAsyncStorageMock(delay: number) {
  return class Storage implements MaybeAsyncStorage {
    storage: Record<string, any> = {};
    public getItem(key: string) {
      return timer(delay).pipe(map(() => this.storage[key]));
    }

    setItem(key: string, value: any): void {
      timer(delay).subscribe(() => {
        this.storage[key] = value + '';
      });
    }

    removeItem(key: string): void {
      timer(delay).subscribe(() => {
        delete this.storage[key];
      });
    }
  };
}
