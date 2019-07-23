import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  Input,
  Optional,
  ElementRef,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';

@Directive({
  selector: '[transloco]'
})
export class TranslocoDirective implements OnInit, OnDestroy {
  subscription: Subscription;
  view: EmbeddedViewRef<any>;

  @Input('transloco') key: string;
  @Input('translocoParams') params: HashMap = {};

  constructor(
    private translocoService: TranslocoService,
    @Optional() private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) {}

  ngOnInit() {
    const { runtime } = this.translocoService.config;

    this.subscription = this.translocoService.lang$
      .pipe(switchMap(lang => this.translocoService.load(lang)))
      .subscribe(data => {
        this.tpl === null ? this.simpleStrategy() : this.structuralStrategy(data);
        this.cdr.markForCheck();

        if (!runtime) {
          this.subscription.unsubscribe();
          this.subscription = null;
        }
      });
  }

  private simpleStrategy() {
    this.host.nativeElement.innerText = this.translocoService.translate(this.key, this.params);
  }

  private structuralStrategy(data) {
    if (this.view) {
      this.view.context['$implicit'] = data;
    } else {
      this.view = this.vcr.createEmbeddedView(this.tpl, {
        $implicit: data
      });
    }
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
