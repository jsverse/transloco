import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { OrArray } from '@jsverse/utils';

import { LangResolver } from './lang-resolver';
import { ScopeResolver } from './scope-resolver';
import { TranslocoService } from './transloco.service';
import { Translation, TranslocoScope } from './transloco.types';
import {
  listenOrNotOperator,
  shouldListenToLangChanges,
} from './utils/lang.utils';
import { resolveInlineLoader } from './utils/scope.utils';

export interface ResolveTranslationParams {
  inlineLang?: string;
  providerLang?: string | null;
  inlineScope?: string;
  providerScope: OrArray<TranslocoScope> | null;
}

export interface ResolvedTranslation {
  lang: string;
  translation: Translation | Translation[];
}

/**
 * Shared by `TranslocoDirective` and `TranslocoPipe`: resolves the active lang
 * for the given inline/provider lang + scope, and loads the (possibly scoped)
 * translation for it, respecting `reRenderOnLangChange`/the `|static` suffix.
 */
@Injectable({ providedIn: 'root' })
export class TranslationResolver {
  private service = inject(TranslocoService);
  private scopeResolver = new ScopeResolver(this.service);

  resolve({
    inlineLang,
    providerLang,
    inlineScope,
    providerScope,
  }: ResolveTranslationParams): Observable<ResolvedTranslation> {
    // Created per `resolve()` call (not a shared field) so its `initialized`
    // flag stays scoped to this call's langChanges$ subscription instead of
    // sticking across separate resolve() invocations (e.g. two
    // TranslocoPipe.transform() calls with different inline langs).
    const langResolver = new LangResolver();
    const listenToLangChange = shouldListenToLangChanges(
      this.service,
      inlineLang || providerLang || undefined,
    );

    return this.service.langChanges$.pipe(
      switchMap((activeLang) => {
        const lang = langResolver.resolve({
          inline: inlineLang,
          provider: providerLang,
          active: activeLang,
        });

        const resolveScope = (scope: TranslocoScope | null) =>
          this.resolveScope(langResolver, lang, scope, inlineScope);

        return Array.isArray(providerScope)
          ? forkJoin(providerScope.map(resolveScope)).pipe(
              // All scopes share the same active lang (only the scope portion
              // of the loaded path differs), so it's safe to read it off the
              // first resolved item.
              map((resolved) => ({
                lang: resolved[0].lang,
                translation: resolved.map((r) => r.translation),
              })),
            )
          : resolveScope(providerScope);
      }),
      listenOrNotOperator(listenToLangChange),
    );
  }

  /**
   * Signal-based counterpart of `resolve()`, for consumers (e.g. a future
   * signal-input-driven `TranslocoDirective`) that want the resolved
   * translation as a `Signal` instead of subscribing to an `Observable`.
   *
   * `paramsFn` is read inside a `computed()`, so it's safe to call from a
   * constructor and to read signal inputs within it; the resulting signal
   * only recomputes the underlying `resolve()` pipeline when the params
   * actually change.
   */
  resolveSignal(
    paramsFn: () => ResolveTranslationParams,
  ): Signal<ResolvedTranslation | undefined> {
    const params$ = toObservable(computed(paramsFn));
    return toSignal(params$.pipe(switchMap((params) => this.resolve(params))), {
      initialValue: undefined,
    });
  }

  private resolveScope(
    langResolver: LangResolver,
    lang: string,
    providerScope: TranslocoScope | null,
    inlineScope?: string,
  ): Observable<ResolvedTranslation> {
    const resolvedScope = this.scopeResolver.resolve({
      inline: inlineScope,
      provider: providerScope,
    });
    const path = langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);

    return this.service._loadDependencies(path, inlineLoader).pipe(
      map((translation) => ({
        lang: langResolver.resolveLangBasedOnScope(path),
        translation,
      })),
    );
  }
}
