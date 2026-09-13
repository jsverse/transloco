import { forkJoin, Observable, switchMap } from 'rxjs';
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

/**
 * Shared by `TranslocoDirective` and `TranslocoPipe`: resolves the active lang
 * for the given inline/provider lang + scope, and loads the (possibly scoped)
 * translation for it, respecting `reRenderOnLangChange`/the `|static` suffix.
 */
export class TranslationResolver {
  private langResolver = new LangResolver();
  private scopeResolver: ScopeResolver;
  private path: string | undefined;

  constructor(private service: TranslocoService) {
    this.scopeResolver = new ScopeResolver(service);
  }

  resolve({
    inlineLang,
    providerLang,
    inlineScope,
    providerScope,
  }: ResolveTranslationParams): Observable<Translation | Translation[]> {
    const listenToLangChange = shouldListenToLangChanges(
      this.service,
      providerLang || inlineLang,
    );

    return this.service.langChanges$.pipe(
      switchMap((activeLang) => {
        const lang = this.langResolver.resolve({
          inline: inlineLang,
          provider: providerLang,
          active: activeLang,
        });

        const resolveScope = (scope: TranslocoScope | null) =>
          this.resolveScope(lang, scope, inlineScope);

        return Array.isArray(providerScope)
          ? forkJoin(providerScope.map(resolveScope))
          : resolveScope(providerScope);
      }),
      listenOrNotOperator(listenToLangChange),
    );
  }

  /** Resolves the lang that was actually used for the last emitted translation. */
  resolveLang(): string {
    return this.langResolver.resolveLangBasedOnScope(this.path!);
  }

  private resolveScope(
    lang: string,
    providerScope: TranslocoScope | null,
    inlineScope?: string,
  ): Observable<Translation | Translation[]> {
    const resolvedScope = this.scopeResolver.resolve({
      inline: inlineScope,
      provider: providerScope,
    });
    this.path = this.langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);

    return this.service._loadDependencies(this.path, inlineLoader);
  }
}
