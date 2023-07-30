import { APP_INITIALIZER, makeEnvironmentProviders } from '@angular/core';

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

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

export function provideTranslocoPreloadLangs(langs: string[]) {
  return makeEnvironmentProviders([
    { provide: TRANSLOCO_PRELOAD_LANGUAGES, useValue: langs },
    {
      provide: APP_INITIALIZER,
      useFactory: () => noop,
      multi: true,
      deps: [TranslocoPreloadLangsService],
    },
  ]);
}
