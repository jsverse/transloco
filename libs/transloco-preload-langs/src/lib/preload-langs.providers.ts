import {
  makeEnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';

import {
  TRANSLOCO_PRELOAD_LANGUAGES,
  TranslocoPreloadLangsService,
} from './preload-langs.service';

export function provideTranslocoPreloadLangs(langs: string[]) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_PRELOAD_LANGUAGES, useValue: langs },
    provideAppInitializer(() => {
      inject(TranslocoPreloadLangsService);
    }),
  ]);
}
