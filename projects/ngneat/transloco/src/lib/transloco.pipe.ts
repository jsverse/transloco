import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TRANSLOCO_SCOPE, TranslocoScopeInterface } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import { getLangFromScope, getScopeFromLang, isTranslocoScopeInterface } from './helpers';
import { shouldListenToLangChanges } from './shared';

@Pipe({
  name: 'transloco',
  pure: false
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  subscription: Subscription = Subscription.EMPTY;
  value: string = '';
  lastKey: string;
  lastParams: HashMap;
  private listenToLangChange: boolean;
  private langName: string;

  constructor(
    private translocoService: TranslocoService,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: string | TranslocoScopeInterface | null,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | null,
    private cdr: ChangeDetectorRef
  ) {
    this.listenToLangChange = shouldListenToLangChanges(this.translocoService, this.providerLang);
  }

  transform(key: string, params: HashMap = {}): string {
    if (!key) {
      return key;
    }

    if (key === this.lastKey && JSON.stringify(params) === JSON.stringify(this.lastParams)) {
      return this.value;
    }

    /* Cache this key and params */
    this.lastKey = key;
    this.lastParams = params;

    /* Clean previous subscription if exists */
    this.subscription.unsubscribe();

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap(activeLang => {
          const lang = this.providerLang || activeLang;
          let providerScope;
          let scopeAlias;
          if (this.providerScope) {
            if (isTranslocoScopeInterface(this.providerScope)) {
              providerScope = this.providerScope.scope;
              scopeAlias = this.providerScope.alias;
            } else {
              providerScope = this.providerScope;
            }
          }
          this.langName = providerScope ? `${providerScope}/${lang}` : lang;
          return this.translocoService._loadDependencies(this.langName, scopeAlias);
        }),
        this.listenToLangChange ? source => source : take(1)
      )
      .subscribe(() => this.updateValue(key, params));

    return this.value;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateValue(key: string, params?: HashMap): void {
    const scope = getScopeFromLang(this.langName);
    const targetLang = scope ? getLangFromScope(this.langName) : this.langName;
    const translation = this.translocoService.translate(key, params, targetLang) as string;
    this.value = translation || key;
    this.cdr.markForCheck();
  }
}
