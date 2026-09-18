import { inject, Injectable, OnDestroy, Provider } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Subscription } from 'rxjs';

import { TranslocoService } from './transloco.service';

/**
 * A `TitleStrategy` that treats the resolved route title (the `title` property
 * on a route config, whether a plain string or a `ResolveFn<string>`) as a
 * Transloco translation key, translates it, and sets it as the document title.
 *
 * How it works:
 * 1. On every navigation, the Router calls {@link updateTitle} with the
 *    fully-resolved `RouterStateSnapshot`. `TitleStrategy.buildTitle()` (the
 *    base class) walks the route tree and returns the deepest route's
 *    resolved `title` — already a plain string, even if it was configured as
 *    a `ResolveFn<string>` — which we treat as a translation key rather than
 *    literal text.
 * 2. That key is translated and set via `Title.setTitle()`, and also cached
 *    on the instance so it can be re-applied later.
 * 3. A single, long-lived subscription to `TranslocoService.langChanges$` (set
 *    up once, when the strategy is created) re-translates the cached key and
 *    re-applies it via `Title.setTitle()` whenever the active language
 *    changes — without requiring a new navigation or a hard refresh, which is
 *    the main limitation of translating the title inside a route's
 *    `ResolveFn`. The subscription is torn down in {@link ngOnDestroy}.
 *
 * Wrap the key with the `marker` function from `@jsverse/transloco-keys-manager`
 * (commonly aliased as `_`) so the keys-manager CLI can statically detect and
 * extract it — a plain string in `title` is otherwise invisible to it, since
 * it isn't passed to `translate()`/the `transloco` pipe/directive.
 *
 * @example
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideTranslocoTitleStrategy()],
 * };
 *
 * // app.routes.ts
 * import { marker as _ } from '@jsverse/transloco-keys-manager/marker';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'design-system',
 *     loadComponent: () => import('./design-system.page'),
 *     title: _('app.menu.design_system'), // a translation key, not literal text
 *   },
 * ];
 */
@Injectable()
export class TranslocoTitleStrategy extends TitleStrategy implements OnDestroy {
  private readonly title = inject(Title);
  private readonly transloco = inject(TranslocoService);
  private titleKey: string | undefined;

  private readonly subscription: Subscription =
    this.transloco.langChanges$.subscribe(() => {
      if (this.titleKey !== undefined) {
        this.applyTitle(this.titleKey);
      }
    });

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleKey = this.buildTitle(snapshot);

    if (this.titleKey !== undefined) {
      this.applyTitle(this.titleKey);
    }
  }

  private applyTitle(key: string): void {
    this.title.setTitle(this.transloco.translate(key));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

/**
 * Registers {@link TranslocoTitleStrategy} as the Router's `TitleStrategy`,
 * so route `title`s are translated and kept in sync with the active language.
 */
export function provideTranslocoTitleStrategy(): Provider {
  return { provide: TitleStrategy, useClass: TranslocoTitleStrategy };
}
