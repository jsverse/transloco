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
import { TRANSLOCO_LANG } from './transloco-lang';

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
  @Input('translocoLoadingTpl') loadingTpl: TemplateRef<any> | undefined;

  private langName: string;
  // Whether we already rendered the view once
  private initialzed = false;

  constructor(
    private translocoService: TranslocoService,
    @Optional() private tpl: TemplateRef<any>,
    @Optional() @Inject(TRANSLOCO_SCOPE) private providerScope: string | null,
    @Optional() @Inject(TRANSLOCO_LANG) private providerLang: string | null,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) {
  }

  ngOnInit() {
    this.hasLoadingTpl() && this.vcr.createEmbeddedView(this.loadingTpl);

    const { runtime } = this.translocoService.config;

    this.subscription = this.translocoService.lang$
      .pipe(
        switchMap(globalLang => {
          const lang = this.getLang(globalLang);
          const scope = this.getScope();
          this.langName = scope ? `${lang}-${scope}` : lang;
          return this.translocoService._load(this.langName)
        }),
        runtime ? source => source : take(1)
      )
      .subscribe(() => {
        const translation = this.translocoService.getTranslation(this.langName);
        this.tpl === null ? this.simpleStrategy() : this.structuralStrategy(translation);
        this.cdr.markForCheck();
        this.initialzed = true;
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
    if( this.view ) {
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
    if( this.initialzed ) {
      return globalLang;
    }

    if( this.inlineLang ) {
      return this.inlineLang
    }

    if( this.providerLang ) {
      return this.providerLang
    }

    return globalLang;
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
