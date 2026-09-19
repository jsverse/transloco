import {
  Injectable,
  InjectionToken,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
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

/**
 * Runs `cb` when the browser is idle and returns a function that cancels it.
 * Falls back to `setTimeout` where `requestIdleCallback` is unavailable (Safari
 * ships it disabled by default). Kept local instead of polyfilling `window` so
 * the package stays free of module-level side effects.
 */
function scheduleIdle(cb: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(cb);

    return () => cancelIdleCallback(id);
  }

  const id = setTimeout(cb, 1);

  return () => clearTimeout(id);
}

@Injectable({ providedIn: 'root' })
export class TranslocoPreloadLangsService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly service = inject(TranslocoService);
  private readonly langs = injectPreloadLangs();
  private readonly cancelIdle: (() => void) | undefined;
  private subscription: Subscription | null = null;

  constructor() {
    // Preloading only warms the browser's cache, so skip it on the server where
    // it would just delay SSR. Same guard as persist-lang: when `ngServerMode` is
    // statically `true` the `isPlatformServer` check tree-shakes out.
    if (
      !this.langs.length ||
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      isPlatformServer(this.platformId)
    ) {
      return;
    }

    // Zone.js patches `setTimeout` (but not `requestIdleCallback`), so schedule
    // outside Angular: the fallback timer then doesn't trigger change detection,
    // matching the `requestIdleCallback` path. Preloading only fills the cache,
    // so there is nothing to render and no need to re-enter the zone.
    this.cancelIdle = this.ngZone.runOutsideAngular(() =>
      scheduleIdle(() => {
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
      }),
    );
  }

  ngOnDestroy() {
    this.cancelIdle?.();
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
