import {ChangeDetectorRef, Inject, OnDestroy, Pipe, PipeTransform} from "@angular/core";
import {TranslocoService} from './transloco.service';
import {HashMap} from './types';
import {defaults, TRANSLOCO_CONFIG, TranslocoConfig} from "./transloco.config";
import {switchMap} from "rxjs/operators";
import {Subscription} from "rxjs";

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

  constructor(
    private translocoService: TranslocoService,
    @Inject(TRANSLOCO_CONFIG) private config: TranslocoConfig,
    private cdr: ChangeDetectorRef){
    const { runtime } = { ...defaults, ...this.config };
    this.runtime = runtime;
  }


  updateValue(key: string, params?: HashMap): void {
    const translation = this.translocoService.translate(key, params);
    this.value = translation !== undefined ? translation : key;
    this.lastKey = key;
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
      .pipe(switchMap(lang => this.translocoService.load(lang)))
      .subscribe(data => {
        this.updateValue(key, params);

        if (!this.runtime) {
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
