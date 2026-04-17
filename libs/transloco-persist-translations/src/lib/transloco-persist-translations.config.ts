import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  Type,
  ValueProvider,
} from '@angular/core';
import { TranslocoLoader } from '@jsverse/transloco';

import { MaybeAsyncStorage } from './transloco.storage';

export interface StorageConfig {
  ttl: number;
  storageKey: string;
}

type providerValue =
  | Pick<ValueProvider, 'useValue'>
  | Pick<ClassProvider, 'useClass'>
  | Pick<ExistingProvider, 'useExisting'>
  | Pick<FactoryProvider, 'useFactory' | 'deps'>;
export interface TranslocoPersistTranslationsConfig
  extends Partial<StorageConfig> {
  loader: Type<TranslocoLoader>;
  storage: providerValue;
}

const dayInMilliseconds = 86_400;
export const defaultConfig: StorageConfig = {
  ttl: dayInMilliseconds,
  storageKey: '@transloco/translations',
};

export const TRANSLOCO_PERSIST_TRANSLATIONS_LOADER =
  /* @__PURE__ */ new InjectionToken<TranslocoLoader>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'TRANSLOCO_PERSIST_TRANSLATIONS_LOADER'
      : '',
  );

export const TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE =
  /* @__PURE__ */ new InjectionToken<MaybeAsyncStorage>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'The storage to use for the persistance behavior'
      : '',
  );

export const TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG =
  /* @__PURE__ */ new InjectionToken<StorageConfig>(
    typeof ngDevMode !== 'undefined' && ngDevMode
      ? 'Configuration for the storage behavior'
      : '',
  );
