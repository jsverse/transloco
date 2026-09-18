import { Injectable, InjectionToken, OnDestroy, inject } from '@angular/core';
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

/** Resolves the provided `TRANSLOCO_PRELOAD_LANGUAGES`. */
export function injectPreloadLangs() {
  return inject(TRANSLOCO_PRELOAD_LANGUAGES);
}

@Injectable({ providedIn: 'root' })
export class TranslocoPreloadLangsService implements OnDestroy {
  private readonly service = inject(TranslocoService);
  private readonly langs = injectPreloadLangs();
  private readonly idleCallbackId: number | undefined;
  private subscription: Subscription | null = null;

  constructor() {
    if (!this.langs.length) return;

    this.idleCallbackId = window.requestIdleCallback(() => {
      const preloads = this.langs.map((currentLangOrScope) => {
        const lang = this.service._completeScopeWithLang(currentLangOrScope);

        let load$ = this.service.load(lang);

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
