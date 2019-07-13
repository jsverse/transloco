import { Directive, TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { TranslateService } from './translate.service';
import { switchMap, pluck } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[translote]'
})
export class TranslateDirective {
  subscription: Subscription;
  view: EmbeddedViewRef<any>;

  constructor(
    private translateService: TranslateService,
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef
  ) {}

  ngOnInit() {
    this.subscription = this.translateService.lang$
      .pipe(
        switchMap(lang => import(`./langs/${lang}.json`)),
        pluck('default')
      )
      .subscribe(data => {
        if (this.view) {
          this.view.context['$implicit'] = data;
        } else {
          this.view = this.vcr.createEmbeddedView(this.tpl, {
            $implicit: data
          });
        }
        this.view.markForCheck();
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
