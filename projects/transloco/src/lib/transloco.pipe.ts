import {ChangeDetectorRef, Inject, OnDestroy, Pipe, PipeTransform} from "@angular/core";
import {TranslocoService} from './transloco.service';
import {HashMap} from './types';
import {defaults, TRANSLOCO_CONFIG, TranslocoConfig} from "./transloco.config";
import {switchMap} from "rxjs/operators";
import {Subscription} from "rxjs";
import deepEqual from 'deep-equal';

@Pipe({
  name: 'transloco',
  pure: false
})
export class TranslocoPipe implements PipeTransform, OnDestroy {
  subscription: Subscription;

  constructor(
    private translocoService: TranslocoService,
    @Inject(TRANSLOCO_CONFIG) private config: TranslocoConfig,
    private cdr: ChangeDetectorRef){}

  value: string = '';
  lastKey: string;
  lastParams: HashMap;

  updateValue(key: string, params?: HashMap): void {
    const translation = this.translocoService.translate(key, params);
    this.value = translation !== undefined ? translation : key;
    this.lastKey = key;
    this.cdr.markForCheck();
  }

  transform(key: string, params: HashMap = {}): any {
    if (!key) {
      return key;
    }

    if (key === this.lastKey && deepEqual(params, this.lastParams)) {
      return this.value;
    }

    if (typeof params !== 'object' || Array.isArray(params)) {
      throw new SyntaxError(`TranslocoPipe expected an object but got ${typeof params}`);
    }

    /* Cache this key and params */
    this.lastKey = key;
    this.lastParams = params;

    const { runtime } = { ...defaults, ...this.config };

    /* Clean previous subscription if exists */
    this.subscription && this.subscription.unsubscribe();

    this.subscription = this.translocoService.lang$
      .pipe(switchMap(lang => this.translocoService.load(lang)))
      .subscribe(data => {
        this.updateValue(key, params);

        if (!runtime) {
          this.subscription.unsubscribe();
          this.subscription = null;
        }
      });

    return this.value;
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
