import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap, MaybeArray, Translation, TranslocoScope } from './types';
import { switchMap } from 'rxjs/operators';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import { listenOrNotOperator, resolveInlineLoader, shouldListenToLangChanges } from './shared';
import { LangResolver } from './lang-resolver';
import { ScopeResolver } from './scope-resolver';

@Pipe({
  name: 'transloco',
  pure: false
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | undefined;
  private lastValue = '';
  private lastKey: string | undefined;
  private listenToLangChange: boolean;
  private path: string | undefined;
  private langResolver = new LangResolver();
  private scopeResolver = new ScopeResolver(this.translocoService);

  constructor(
    private translocoService: TranslocoService,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: MaybeArray<TranslocoScope> | undefined,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | undefined,
    private cdr: ChangeDetectorRef
  ) {
    this.listenToLangChange = shouldListenToLangChanges(this.translocoService, this.providerLang);
  }

  // null is for handling strict mode + async pipe types https://github.com/ngneat/transloco/issues/311
  transform(key: string | null, params?: HashMap, inlineLang?: string): string {
    if (!key) {
      return key as any;
    }

    const keyName = params ? `${key}${JSON.stringify(params)}` : key;

    if (keyName === this.lastKey) {
      return this.lastValue;
    }

    this.lastKey = keyName;
    this.subscription?.unsubscribe();

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap(activeLang => {
          const lang = this.langResolver.resolve({
            inline: inlineLang,
            provider: this.providerLang,
            active: activeLang
          });

          return Array.isArray(this.providerScope)
            ? forkJoin(
              (<TranslocoScope[]>this.providerScope).map(providerScope => this.resolveScope(lang, providerScope))
            )
            : this.resolveScope(lang, this.providerScope);
        }),
        listenOrNotOperator(this.listenToLangChange)
      )
      .subscribe(() => this.updateValue(key, params));

    return this.lastValue;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateValue(key: string, params?: HashMap | undefined) {
    const lang = this.langResolver.resolveLangBasedOnScope(this.path!);
    this.lastValue = this.translocoService.translate(key, params, lang);
    this.cdr.markForCheck();
  }

  private resolveScope(lang: string, providerScope: TranslocoScope): Observable<Translation | Translation[]> {
    const resolvedScope = this.scopeResolver.resolve({ inline: undefined, provider: providerScope });
    this.path = this.langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);
    return this.translocoService._loadDependencies(this.path, inlineLoader);
  }
}
