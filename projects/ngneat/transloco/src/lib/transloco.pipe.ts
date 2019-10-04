import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TRANSLOCO_SCOPE, TranslocoScope } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import { getLangFromScope, getScopeFromLang, isTranslocoScope } from './helpers';
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
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: string | TranslocoScope | null,
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
          if (this.providerScope) {
            if (isTranslocoScope(this.providerScope)) {
              providerScope = this.providerScope.scope;
              this.translocoService._setScopeAlias(providerScope, this.providerScope.alias);
            } else {
              providerScope = this.providerScope;
            }
          }
          this.langName = providerScope ? `${providerScope}/${lang}` : lang;
          return this.translocoService._loadDependencies(this.langName);
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
    this.value = this.translocoService.translate(key, params, targetLang) as string;
    this.cdr.markForCheck();
  }
}
