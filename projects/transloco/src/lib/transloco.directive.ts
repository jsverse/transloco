import { Directive, TemplateRef, ViewContainerRef, EmbeddedViewRef, Inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslocoService } from './transloco.service';
import { TRANSLOCO_CONFIG, TranslocoConfig, defaults } from './transloco.config';

@Directive({
  selector: '[transloco]'
})
export class TranslocoDirective {
  subscription: Subscription;
  view: EmbeddedViewRef<any>;

  constructor(
    private translateService: TranslocoService,
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    @Inject(TRANSLOCO_CONFIG) private config: TranslocoConfig
  ) {}

  ngOnInit() {
    const { runtime } = { ...defaults, ...this.config };

    this.subscription = this.translateService.lang$
      .pipe(switchMap(lang => this.translateService.load(lang)))
      .subscribe(data => {
        if (this.view) {
          this.view.context['$implicit'] = data;
        } else {
          this.view = this.vcr.createEmbeddedView(this.tpl, {
            $implicit: data,
            translate: data
          });
        }
        this.view.markForCheck();

        if (!runtime) {
          this.subscription.unsubscribe();
          this.subscription = null;
        }
      });
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
