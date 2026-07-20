import {
  makeEnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';

import {
  TRANSLOCO_PRELOAD_LANGUAGES,
  TranslocoPreloadLangsService,
} from './preload-langs.service';

interface IdleDeadline {
  didTimeout: false;
  timeRemaining: () => number;
}

window.requestIdleCallback =
  window.requestIdleCallback ??
  function (cb: (deadLine: IdleDeadline) => void) {
    const start = Date.now();

    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ??
  function (id: number) {
    clearTimeout(id);
  };

export function provideTranslocoPreloadLangs(langs: string[]) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_PRELOAD_LANGUAGES, useValue: langs },
    provideAppInitializer(() => {
      inject(TranslocoPreloadLangsService);
    }),
  ]);
}
