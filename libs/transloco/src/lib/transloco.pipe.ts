import {
  ChangeDetectorRef,
  Inject,
  OnDestroy,
  Optional,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { forkJoin, Observable, Subscription, switchMap } from 'rxjs';
import { OrArray } from '@jsverse/utils';

import { TranslocoService } from './transloco.service';
import { Translation, TranslocoScope } from './transloco.types';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import {
  listenOrNotOperator,
  shouldListenToLangChanges,
} from './utils/lang.utils';
import { LangResolver } from './lang-resolver';
import { ScopeResolver } from './scope-resolver';
import { HashMap } from './utils/type.utils';
import { resolveInlineLoader } from './utils/scope.utils';

@Pipe({
  name: 'transloco',
  pure: false,
  standalone: true,
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private lastValue = '';
  private lastKey: string | undefined;
  private path: string | undefined;
  private langResolver = new LangResolver();
  private scopeResolver!: ScopeResolver;

  constructor(
    private service: TranslocoService,
    @Optional()
    @Inject(TRANSLOCO_SCOPE)
    private providerScope: OrArray<TranslocoScope> | undefined,
    @Optional()
    @Inject(TRANSLOCO_LANG)
    private providerLang: string | undefined,
    private cdr: ChangeDetectorRef,
  ) {
    this.scopeResolver = new ScopeResolver(this.service);
  }

  // null is for handling strict mode + async pipe types https://github.com/jsverse/transloco/issues/311
  // null is for handling strict mode + optional chaining types https://github.com/jsverse/transloco/issues/488
  transform(
    key?: string | null,
    params?: HashMap,
    inlineLang?: string,
  ): string {
    if (!key) {
      return key as any;
    }

    const keyName = params ? `${key}${JSON.stringify(params)}` : key;

    if (keyName === this.lastKey) {
      return this.lastValue;
    }

    this.lastKey = keyName;
    this.subscription?.unsubscribe();

    const listenToLangChange = shouldListenToLangChanges(
      this.service,
      this.providerLang || inlineLang,
    );

    this.subscription = this.service.langChanges$
      .pipe(
        switchMap((activeLang) => {
          const lang = this.langResolver.resolve({
            inline: inlineLang,
            provider: this.providerLang,
            active: activeLang,
          });

          return Array.isArray(this.providerScope)
            ? forkJoin(
                this.providerScope.map((providerScope) =>
                  this.resolveScope(lang, providerScope),
                ),
              )
            : this.resolveScope(lang, this.providerScope);
        }),
        listenOrNotOperator(listenToLangChange),
      )
      .subscribe(() => this.updateValue(key, params));

    return this.lastValue;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }

  private updateValue(key: string, params?: HashMap | undefined) {
    const lang = this.langResolver.resolveLangBasedOnScope(this.path!);
    this.lastValue = this.service.translate(key, params, lang);
    this.cdr.markForCheck();
  }

  private resolveScope(
    lang: string,
    providerScope: TranslocoScope | null,
  ): Observable<Translation | Translation[]> {
    const resolvedScope = this.scopeResolver.resolve({
      inline: undefined,
      provider: providerScope,
    });
    this.path = this.langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);

    return this.service._loadDependencies(this.path, inlineLoader);
  }
}
