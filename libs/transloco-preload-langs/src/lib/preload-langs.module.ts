import { ModuleWithProviders, NgModule } from '@angular/core';
import {
  PRELOAD_LANGUAGES,
  TranslocoPreloadLangsService,
} from './preload-langs.service';

interface IdleDeadline {
  didTimeout: false;
  timeRemaining: () => number;
}

(window as any).requestIdleCallback =
  (window as any).requestIdleCallback ||
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

(window as any).cancelIdleCallback =
  (window as any).cancelIdleCallback ||
  function (id: number) {
    clearTimeout(id);
  };

@NgModule()
export class TranslocoPreloadLangsModule {
  static forRoot(
    langs: string[]
  ): ModuleWithProviders<TranslocoPreloadLangsModule> {
    return {
      ngModule: TranslocoPreloadLangsModule,
      providers: [
        TranslocoPreloadLangsService,
        { provide: PRELOAD_LANGUAGES, useValue: langs },
      ],
    };
  }
}
