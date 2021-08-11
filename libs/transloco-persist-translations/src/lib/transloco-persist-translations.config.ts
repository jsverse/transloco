import { InjectionToken, Provider, Type } from '@angular/core';
import { TranslocoLoader } from '@ngneat/transloco';

export interface StorageConfig {
  ttl: number;
  storageKey: string;
}

export interface TranslocoPersistTranslationsConfig extends Partial<StorageConfig> {
  loader: Type<TranslocoLoader>;
  storage: Provider;
}

const oneDay = 86400;
export const defaultConfig: Required<StorageConfig> = {
  ttl: oneDay,
  storageKey: '@transloco/translations'
};

export const PERSIST_TRANSLATIONS_LOADER = new InjectionToken<Type<TranslocoLoader>>('PERSIST_TRANSLATIONS_LOADER');
export const PERSIST_TRANSLATIONS_STORAGE = new InjectionToken<Provider>('The storage to use for the persistance behavior');
export const PERSIST_TRANSLATIONS_STORAGE_CONFIG = new InjectionToken<Provider>('Configuration for the storage behavior');
