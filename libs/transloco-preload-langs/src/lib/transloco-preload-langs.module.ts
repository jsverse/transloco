import { Inject, InjectionToken, ModuleWithProviders, NgModule, OnDestroy } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { forkJoin, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

declare global {
  interface Window {
    requestIdleCallback: Function;
    cancelIdleCallback: Function;
  }
}

window.requestIdleCallback =
  window.requestIdleCallback ||
  function(cb: Function) {
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
  function(id: number) {
    clearTimeout(id);
  };

const PRELOAD_LANGUAGES = new InjectionToken<string[]>('Languages to be preloaded');

@NgModule()
export class TranslocoPreloadLangsModule implements OnDestroy {
  private idleCallbackId: any;
  private subscription: Subscription | undefined;

  static preload(langs: string[]): ModuleWithProviders<TranslocoPreloadLangsModule> {
    return {
      ngModule: TranslocoPreloadLangsModule,
      providers: [{ provide: PRELOAD_LANGUAGES, useValue: langs }]
    };
  }

  constructor(service: TranslocoService, @Inject(PRELOAD_LANGUAGES) langs: string[]) {
    if (!langs) return;

    this.idleCallbackId = window.requestIdleCallback(() => {
      const preloads = langs.map(currentLangOrScope => {
        const lang = service._completeScopeWithLang(currentLangOrScope);

        return service.load(lang).pipe(
          tap(() => {
            if (service.config.prodMode === false) {
              console.log(`%c 👁 Preloaded ${lang}`, 'background: #fff; color: #607D8B;');
            }
          })
        );
      });
      this.subscription = forkJoin(preloads).subscribe();
    });
  }

  ngOnDestroy() {
    if (this.idleCallbackId !== undefined) {
      window.cancelIdleCallback(this.idleCallbackId);
    }
    this.subscription?.unsubscribe();
  }
}
