import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TRANSLOCO_SCOPE, TranslocoScope } from './transloco-scope';
import { TRANSLOCO_LANG } from './transloco-lang';
import { getLangFromScope, getPipeValue, getScopeFromLang, isTranslocoScope } from './helpers';
import { shouldListenToLangChanges } from './shared';

@Pipe({
  name: 'transloco',
  pure: false
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private lastValue: string | undefined;
  private lastKey: string | undefined;
  private listenToLangChange: boolean;
  private langName: string;
  private init = true;

  constructor(
    private translocoService: TranslocoService,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: string | TranslocoScope | null,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | null,
    private cdr: ChangeDetectorRef
  ) {
    this.listenToLangChange = shouldListenToLangChanges(this.translocoService, this.providerLang);
  }

  transform(key: string, params?: HashMap): string {
    if (!key) {
      return key;
    }

    const keyName = params ? `${key}${JSON.stringify(params)}` : key;
    if (keyName === this.lastKey) {
      return this.lastValue;
    }

    this.lastKey = keyName;
    this.subscription && this.subscription.unsubscribe();

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap(activeLang => {
          let lang = this.init && this.providerLang ? this.providerLang : activeLang;

          if (this.providerLang && this.init) {
            const [_, extractLang] = getPipeValue(this.providerLang, 'static');
            lang = extractLang;
          }
          this.init = false;

          let providerScope;
          if (this.providerScope) {
            providerScope = this.providerScope;
            if (isTranslocoScope(this.providerScope)) {
              const { scope, alias } = this.providerScope;
              providerScope = scope;
              this.translocoService._setScopeAlias(providerScope, alias);
            }
          }
          this.langName = providerScope ? `${providerScope}/${lang}` : lang;

          return this.translocoService._loadDependencies(this.langName);
        }),
        this.listenToLangChange ? source => source : take(1)
      )
      .subscribe(() => this.updateValue(key, params));

    return this.lastValue;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateValue(key: string, params?: HashMap): void {
    const scope = getScopeFromLang(this.langName);
    const targetLang = scope ? getLangFromScope(this.langName) : this.langName;
    this.lastValue = this.translocoService.translate(key, params, targetLang) as string;
    this.cdr.markForCheck();
  }
}
