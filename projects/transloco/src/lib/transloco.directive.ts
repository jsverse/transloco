import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';
import { TRANSLOCO_SCOPE } from './transloco-scope';

@Directive({
  selector: '[transloco]'
})
export class TranslocoDirective implements OnInit, OnDestroy, OnChanges {
  subscription: Subscription;
  view: EmbeddedViewRef<any>;

  @Input('transloco') key: string;
  @Input('translocoParams') params: HashMap = {};
  @Input('translocoScope') scope: string | undefined;
  @Input('translocoLoadingTpl') loadingTpl: TemplateRef<any> | undefined;

  private langName: string;

  constructor(
    private translocoService: TranslocoService,
    @Optional() private tpl: TemplateRef<any>,
    @Optional() @Inject(TRANSLOCO_SCOPE) private provideScope: string | null,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) {}

  ngOnInit() {
    this.hasLoadingTpl() && this.vcr.createEmbeddedView(this.loadingTpl);

    const { runtime } = this.translocoService.config;
    this.subscription = this.translocoService.lang$
      .pipe(
        switchMap(lang => {
          // TODO: we need to move this logic to some common place,
          //  since we also need that in the service.
          this.langName = this.getScope() ? `${lang}-${this.getScope()}` : lang;
          return this.translocoService._load(this.langName);
        }),
        runtime ? source => source : take(1)
      )
      .subscribe(data => {
        this.tpl === null ? this.simpleStrategy() : this.structuralStrategy(data);
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes) {
    // We need to support dynamic keys/params, so if this is not the first change CD cycle
    // we need to run the function again in order to update the value
    const notInit = Object.keys(changes).some(v => changes[v].firstChange === false);
    notInit && this.simpleStrategy();
  }

  private simpleStrategy() {
    this.host.nativeElement.innerText = this.translocoService.translate(this.key, this.params, this.langName);
  }

  private structuralStrategy(data) {
    if (this.view) {
      this.view.context['$implicit'] = data;
    } else {
      this.hasLoadingTpl() && this.vcr.clear();
      this.view = this.vcr.createEmbeddedView(this.tpl, {
        $implicit: data
      });
    }
  }

  private hasLoadingTpl() {
    return this.loadingTpl instanceof TemplateRef;
  }

  private getScope() {
    return this.scope || this.provideScope;
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
