import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  makeEnvironmentProviders,
  ValueProvider,
  inject,
  provideAppInitializer,
} from '@angular/core';

import {
  PersistLangConfig,
  TRANSLOCO_PERSIST_LANG_CONFIG,
  TRANSLOCO_PERSIST_LANG_STORAGE,
} from './persist-lang.config';
import { TranslocoPersistLangService } from './persist-lang.service';

type providerValue =
  | Pick<ValueProvider, 'useValue'>
  | Pick<ClassProvider, 'useClass'>
  | Pick<ExistingProvider, 'useExisting'>
  | Pick<FactoryProvider, 'useFactory' | 'deps'>;
export function provideTranslocoPersistLang({
  storage,
  ...config
}: PersistLangConfig & { storage: providerValue }) {
  return makeEnvironmentProviders([
    {
      provide: TRANSLOCO_PERSIST_LANG_CONFIG,
      useValue: config ?? {},
    },
    // Initialize the service
    provideAppInitializer(() => {
      inject(TranslocoPersistLangService);
    }),
    {
      provide: TRANSLOCO_PERSIST_LANG_STORAGE,
      ...storage,
    },
  ]);
}
