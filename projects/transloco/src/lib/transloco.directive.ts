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
  ViewContainerRef,
  Type
} from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { TemplateHandler, View } from './template-handler';
import { TRANSLOCO_LANG } from './transloco-lang';
import { TRANSLOCO_LOADING_TEMPLATE } from './transloco-loading-template';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoService } from './transloco.service';
import { HashMap } from './types';

@Directive({
  selector: '[transloco]'
})
export class TranslocoDirective implements OnInit, OnDestroy, OnChanges {
  subscription: Subscription;
  view: EmbeddedViewRef<any>;

  @Input('transloco') key: string;
  @Input('translocoParams') params: HashMap = {};
  @Input('translocoScope') inlineScope: string | undefined;
  @Input('translocoLang') inlineLang: string | undefined;
  @Input('translocoLoadingTpl') inlineTpl: TemplateRef<any> | undefined;

  private langName: string;
  private loaderTplHandler: TemplateHandler = null;
  // Whether we already rendered the view once
  private initialized = false;

  constructor(
    private translocoService: TranslocoService,
    @Optional() private tpl: TemplateRef<any>,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: string | null,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | null,
    @Optional() @Inject(TRANSLOCO_LOADING_TEMPLATE) private providedLoadingTpl: Type<any> | string,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) {}

  ngOnInit() {
    const loadingTpl = this.getLoadingTpl();
    if (loadingTpl) {
      this.loaderTplHandler = new TemplateHandler(loadingTpl, this.vcr);
      this.loaderTplHandler.attachView();
    }

    const { runtime } = this.translocoService.config;

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap(globalLang => {
          const lang = this.getLang(globalLang);
          const scope = this.getScope();
          this.langName = scope ? `${scope}/${lang}` : lang;
          return this.translocoService.load(this.langName);
        }),
        runtime ? source => source : take(1)
      )
      .subscribe(() => {
        const translation = this.translocoService.getTranslation(this.langName);
        this.tpl === null ? this.simpleStrategy() : this.structuralStrategy(translation);
        this.cdr.markForCheck();
        this.initialized = true;
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
      this.loaderTplHandler && this.loaderTplHandler.detachView();
      this.view = this.vcr.createEmbeddedView(this.tpl, {
        $implicit: data
      });
    }
  }

  private getLoadingTpl(): View {
    return this.inlineTpl || this.providedLoadingTpl;
  }

  // inline => providers
  private getScope() {
    return this.inlineScope || this.providerScope;
  }

  // inline => providers => global
  private getLang(globalLang: string) {
    /**
     * When the user changes the lang we need to update
     * the view. Otherwise, the lang will remain the inline/provided lang
     */
    if (this.initialized) {
      return globalLang;
    }

    if (this.inlineLang) {
      return this.inlineLang;
    }

    if (this.providerLang) {
      return this.providerLang;
    }

    return globalLang;
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
