import { InjectionToken, Provider, Type } from '@angular/core';
import { TranslocoLoader } from '@ngneat/transloco';

export type TranslocoPersistTranslationsConfig = {
  ttl?: number;
  storageKey?: string;
  loader: Type<TranslocoLoader>;
  storage: Provider;
};

export const defaultConfig: TranslocoPersistTranslationsConfig = {
  ttl: 86400, // One day
  storageKey: '@transloco/translations',
  loader: null,
  storage: null
};

export const PERSIST_TRANSLATIONS_LOADER = new InjectionToken('PERSIST_TRANSLATIONS_LOADER');
export const PERSIST_TRANSLATIONS_STORAGE = new InjectionToken('PERSIST_TRANSLATIONS_STORAGE');
export const PERSIST_TRANSLATIONS_CONFIG = new InjectionToken('PERSIST_TRANSLATIONS_CONFIG');
