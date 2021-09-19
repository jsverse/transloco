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
  private subscription: Subscription | null = null;
  private lastValue: string = '';
  private lastKey: string | undefined;
  private path: string;
  private langResolver = new LangResolver();
  private scopeResolver = new ScopeResolver(this.translocoService);

  constructor(
    private translocoService: TranslocoService,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: MaybeArray<TranslocoScope>,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | null,
    private cdr: ChangeDetectorRef
  ) {}

  // null is for handling strict mode + async pipe types https://github.com/ngneat/transloco/issues/311
  // null is for handling strict mode + optional chaining types https://github.com/ngneat/transloco/issues/488
  transform(key: string | null | undefined, params?: HashMap | undefined, inlineLang?: string | undefined): string {
    if (!key) {
      return key;
    }

    const keyName = params ? `${key}${JSON.stringify(params)}` : key;

    if (keyName === this.lastKey) {
      return this.lastValue;
    }

    this.lastKey = keyName;
    this.subscription && this.subscription.unsubscribe();

    const listenToLangChange = shouldListenToLangChanges(this.translocoService, this.providerLang || inlineLang);

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap(activeLang => {
          const lang = this.langResolver.resolve({
            inline: inlineLang,
            provider: this.providerLang,
            active: activeLang
          });

          let resolvedScope;

          if (Array.isArray(this.providerScope)) {
            const keyPrefix = key.split('.')[0];
            const derivedScope = this.providerScope.find(s =>
              typeof s === 'string' ? s === keyPrefix : s.alias === keyPrefix || s.scope === keyPrefix
            );

            resolvedScope = this.resolveScope(lang, derivedScope);
          } else {
            resolvedScope = this.resolveScope(lang, this.providerScope);
          }

          return resolvedScope;
        }),
        listenOrNotOperator(listenToLangChange)
      )
      .subscribe(() => this.updateValue(key, params));

    return this.lastValue;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
      // callback within its `destination` property, preventing classes from being GC'd.
      this.subscription = null;
    }
  }

  private updateValue(key: string, params?: HashMap | undefined) {
    const lang = this.langResolver.resolveLangBasedOnScope(this.path);
    this.lastValue = this.translocoService.translate(key, params, lang);
    this.cdr.markForCheck();
  }

  private resolveScope(lang: string, providerScope: TranslocoScope): Observable<Translation | Translation[]> {
    let resolvedScope = this.scopeResolver.resolve({ inline: undefined, provider: providerScope });
    this.path = this.langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);
    return this.translocoService._loadDependencies(this.path, inlineLoader);
  }
}
