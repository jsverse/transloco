import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { getPipeValue, TranslocoService } from '@ngneat/transloco';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';

declare global {
  interface Window {
    requestIdleCallback: Function;
    cancelIdleCallback: Function;
  }
}

window.requestIdleCallback =
  window.requestIdleCallback ||
  function(cb) {
    const start = Date.now();
    return setTimeout(function() {
      cb({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function(id) {
    clearTimeout(id);
  };

@NgModule()
export class TranslocoPreloadLangsModule {
  static preload(langs: string[]): ModuleWithProviders {
    return {
      ngModule: TranslocoPreloadLangsModule,
      providers: [{ provide: 'PreloadLangs', useValue: langs }]
    };
  }

  constructor(service: TranslocoService, @Inject('PreloadLangs') langs: string[]) {
    if (!langs) return;
    window.requestIdleCallback(() => {
      const preloads = langs.map(currentLang => {
        const [isScoped, scopedPath] = getPipeValue(currentLang, 'scoped');
        const lang = isScoped ? `${scopedPath}/${service.getActiveLang()}` : currentLang;
        return service.load(lang).pipe(
          tap(() => {
            if (service.config.prodMode === false) {
              console.log(`%c 👁 Preloaded ${lang}`, 'background: #fff; color: #607D8B;');
            }
          })
        );
      });
      forkJoin(preloads).subscribe();
    });
  }
}
