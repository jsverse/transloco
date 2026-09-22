import { Injectable, OnDestroy, Provider, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { filter, merge, Subscription } from 'rxjs';

import { getValue, TranslocoService } from '@jsverse/transloco';

import {
  injectTitleStrategyConfig,
  TRANSLOCO_TITLE_STRATEGY_CONFIG,
  TranslocoTitleStrategyConfig,
} from './title-strategy.config';

export type { TranslocoTitleStrategyConfig } from './title-strategy.config';

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
 * 3. A single, long-lived subscription (set up once, when the strategy is
 *    created) re-translates the cached key and re-applies it via
 *    `Title.setTitle()` whenever:
 *    - the active language changes (`TranslocoService.langChanges$`), or
 *    - any translation successfully loads (`TranslocoService.events$`,
 *      filtered to `translationLoadSuccess`) — this covers a scoped/lazy-
 *      loaded title key that isn't available yet on the *first* navigation to
 *      its route: by default ({@link TranslocoTitleStrategyConfig.whenMissing}
 *      `'wait'`) the title is left untouched (the previous route's title
 *      stays until the key resolves) rather than briefly showing the raw
 *      key, and it's applied as soon as its scope finishes loading.
 *
 *    None of this requires a new navigation or a hard refresh, which is the
 *    main limitation of translating the title inside a route's `ResolveFn`.
 *    The subscription is torn down in {@link ngOnDestroy}.
 *
 * If the project uses `@jsverse/transloco-keys-manager`, a plain-string
 * `title` on a route is automatically detected and extracted as a
 * translation key — no `marker`/`_()` wrapping needed, unlike other plain
 * strings the keys-manager CLI can't otherwise see (since they aren't passed
 * to `translate()`/the `transloco` pipe/directive). This only kicks in once
 * `provideTranslocoTitleStrategy` is imported somewhere in the project.
 *
 * A scoped title is a plain string prefixed with the scope alias
 * (`title: 'admin.title'`), the same as `{{ 'admin.title' | transloco }}`:
 * it's translated as-is at runtime, and the keys-manager CLI extracts it into
 * that scope's translation file.
 *
 * The strategy doesn't load scopes itself: a scoped title resolves once its
 * scope is loaded, which happens when the page uses it (pipe, directive or
 * `translateSignal`) under a `provideTranslocoScope()` declared on the route
 * or the component. Until then the title is left as-is (see
 * {@link TranslocoTitleStrategyConfig.whenMissing}), and it's set as soon as
 * the scope finishes loading.
 *
 * @example
 * // app.config.ts
 * import { provideTranslocoTitleStrategy } from '@jsverse/transloco/router';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideTranslocoTitleStrategy()],
 * };
 *
 * // app.routes.ts
 * export const routes: Routes = [
 *   {
 *     // A global-scope key - auto-extracted, no `marker`/`_()` needed.
 *     path: 'design-system',
 *     loadComponent: () => import('./design-system.page'),
 *     title: 'app.menu.design_system',
 *   },
 *   {
 *     // A scoped key - prefixed with the scope alias.
 *     path: 'admin',
 *     loadChildren: () => import('./admin/admin.routes'),
 *     title: 'admin.title',
 *   },
 * ];
 */
@Injectable()
export class TranslocoTitleStrategy extends TitleStrategy implements OnDestroy {
  protected readonly title = inject(Title);
  protected readonly transloco = inject(TranslocoService);
  private readonly config = injectTitleStrategyConfig();
  protected titleKey: string | undefined;

  private readonly subscription: Subscription = merge(
    this.transloco.langChanges$,
    this.transloco.events$.pipe(
      filter((event) => event.type === 'translationLoadSuccess'),
    ),
  ).subscribe(() => {
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

  protected applyTitle(key: string): void {
    const translation = this.transloco.getTranslation(
      this.transloco.getActiveLang(),
    );
    const whenMissing = this.config.whenMissing ?? 'wait';

    if (whenMissing === 'wait' && getValue(translation, key) === undefined) {
      // The key's scope is still loading (or the key is wrong and we'll
      // never hear back) - wait rather than translate a key that isn't
      // there yet, which would log a dev-mode "Missing translation" warning
      // and briefly show the raw key as the title.
      return;
    }

    const translated = this.transloco.translate(key);
    const title = this.config.format
      ? this.config.format(translated)
      : translated;

    if (this.title.getTitle() !== title) {
      this.title.setTitle(title);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

/**
 * Registers {@link TranslocoTitleStrategy} as the Router's `TitleStrategy`,
 * so route `title`s are translated and kept in sync with the active language.
 */
export function provideTranslocoTitleStrategy(
  config: TranslocoTitleStrategyConfig = {},
): Provider[] {
  return [
    { provide: TitleStrategy, useClass: TranslocoTitleStrategy },
    { provide: TRANSLOCO_TITLE_STRATEGY_CONFIG, useValue: config },
  ];
}
