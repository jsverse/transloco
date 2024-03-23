import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { tap } from 'rxjs/operators';
import { forkJoin, Subscription } from 'rxjs';

export const TRANSLOCO_PRELOAD_LANGUAGES = new InjectionToken<string[]>(
  'Languages to be preloaded'
);

@Injectable({ providedIn: 'root' })
export class TranslocoPreloadLangsService implements OnDestroy {
  private readonly idleCallbackId: number | undefined;
  private subscription: Subscription | null = null;

  constructor(
    service: TranslocoService,
    @Inject(TRANSLOCO_PRELOAD_LANGUAGES) langs: string[]
  ) {
    if (!langs.length) return;

    this.idleCallbackId = window.requestIdleCallback(() => {
      const preloads = langs.map((currentLangOrScope) => {
        const lang = service._completeScopeWithLang(currentLangOrScope);

        return service.load(lang).pipe(
          tap(() => {
            if (!service.config.prodMode) {
              console.log(
                `%c 👁 Preloaded ${lang}`,
                'background: #fff; color: #607D8B;'
              );
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
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }
}
