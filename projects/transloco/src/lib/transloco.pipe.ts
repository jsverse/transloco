import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TRANSLOCO_SCOPE } from './transloco-scope';

@Pipe({
  name: 'transloco',
  pure: false
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  subscription: Subscription;
  value: string = '';
  lastKey: string;
  lastParams: HashMap;
  private readonly runtime: boolean;
  private langName: string;

  constructor(
    private translocoService: TranslocoService,
    @Inject(TRANSLOCO_CONFIG) private config: TranslocoConfig,
    @Optional() @Inject(TRANSLOCO_SCOPE) private provideScope: string | null,
    private cdr: ChangeDetectorRef
  ) {
    const { runtime } = { ...defaultConfig, ...this.config };
    this.runtime = runtime;
  }

  updateValue(key: string, params?: HashMap): void {
    const translation = this.translocoService.translate(key, params, this.langName);
    this.value = translation || key;
    this.cdr.markForCheck();
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
    this.subscription && this.subscription.unsubscribe();

    this.subscription = this.translocoService.lang$
      .pipe(
        switchMap(lang => {
          this.langName = this.provideScope ? `${lang}-${this.provideScope}` : lang;
          return this.translocoService.load(this.langName);
        }),
        this.runtime ? source => source : take(1)
      )
      .subscribe(() => {
        this.updateValue(key, params);
      });

    return this.value;
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
