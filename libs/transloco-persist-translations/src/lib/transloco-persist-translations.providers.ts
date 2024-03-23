import { makeEnvironmentProviders } from '@angular/core';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';

import { TranslocoPersistTranslations } from './transloco-persist-translations.service';
import {
  defaultConfig,
  StorageConfig,
  TRANSLOCO_PERSIST_TRANSLATIONS_LOADER,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE,
  TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG,
  TranslocoPersistTranslationsConfig,
} from './transloco-persist-translations.config';

export function provideTranslocoPersistTranslations({
  storage,
  loader,
  ...storageConfig
}: TranslocoPersistTranslationsConfig) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_LOADER, useClass: TranslocoPersistTranslations },
    provideTranslocoPersistTranslationsConfig(storageConfig),
    { provide: TRANSLOCO_PERSIST_TRANSLATIONS_LOADER, useClass: loader },
    { provide: TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE, ...storage },
  ]);
}

export function provideTranslocoPersistTranslationsConfig(
  config?: Partial<StorageConfig>
) {
  return {
    provide: TRANSLOCO_PERSIST_TRANSLATIONS_STORAGE_CONFIG,
    useValue: {
      ...defaultConfig,
      ...config,
    },
  };
}
