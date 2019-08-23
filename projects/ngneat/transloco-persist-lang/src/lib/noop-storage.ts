import { PersisStorage } from '@ngneat/transloco';

export const noopStorage: PersisStorage = {
  getItem(key?: string): string | null {
    return;
  },
  removeItem(key: string): void {},
  setItem(key: string, value: string): void {}
};
