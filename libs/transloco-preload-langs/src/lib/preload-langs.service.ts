import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { tap } from 'rxjs/operators';
import { forkJoin, Subscription } from 'rxjs';

export const TRANSLOCO_PRELOAD_LANGUAGES = /* @__PURE__ */ new InjectionToken<
  string[]
>(
  typeof ngDevMode !== 'undefined' && ngDevMode
    ? 'Languages to be preloaded'
    : '',
);

@Injectable({ providedIn: 'root' })
export class TranslocoPreloadLangsService implements OnDestroy {
  private readonly idleCallbackId: number | undefined;
  private subscription: Subscription | null = null;

  constructor(
    service: TranslocoService,
    @Inject(TRANSLOCO_PRELOAD_LANGUAGES) langs: string[],
  ) {
    if (!langs.length) return;

    this.idleCallbackId = window.requestIdleCallback(() => {
      const preloads = langs.map((currentLangOrScope) => {
        const lang = service._completeScopeWithLang(currentLangOrScope);

        let load$ = service.load(lang);

        if (typeof ngDevMode !== 'undefined' && ngDevMode) {
          load$ = load$.pipe(
            tap(() => {
              console.log(
                `%c 👁 Preloaded ${lang}`,
                'background: #fff; color: #607D8B;',
              );
            }),
          );
        }

        return load$;
      });
      this.subscription = forkJoin(preloads).subscribe();
    });
  }

  ngOnDestroy() {
    if (this.idleCallbackId !== undefined) {
      window.cancelIdleCallback(this.idleCallbackId);
    }

    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
