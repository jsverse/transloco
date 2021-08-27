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
  SimpleChanges,
  TemplateRef,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TemplateHandler, View } from './template-handler';
import { TRANSLOCO_LANG } from './transloco-lang';
import { TRANSLOCO_LOADING_TEMPLATE } from './transloco-loading-template';
import { TRANSLOCO_SCOPE } from './transloco-scope';
import { TranslocoService } from './transloco.service';
import { HashMap, MaybeArray, Translation, TranslocoScope } from './types';
import {
  listenOrNotOperator,
  resolveInlineLoader,
  shouldListenToLangChanges,
} from './shared';
import { LangResolver } from './lang-resolver';
import { ScopeResolver } from './scope-resolver';

type TranslateFn = (key: string, params?: HashMap) => any;
interface ViewContext {
  $implicit: TranslateFn;
  currentLang: string;
}

@Directive({
  selector: '[transloco]',
})
export class TranslocoDirective implements OnInit, OnDestroy, OnChanges {
  subscription: Subscription | undefined;
  view: EmbeddedViewRef<ViewContext> | undefined;

  private translationMemo: Record<string, { value: any; params?: HashMap }> =
    {};

  @Input('transloco') key: string | undefined;
  @Input('translocoParams') params: HashMap = {};
  @Input('translocoScope') inlineScope: string | undefined;
  @Input('translocoRead') inlineRead: string | undefined;
  @Input('translocoLang') inlineLang: string | undefined;
  @Input('translocoLoadingTpl') inlineTpl: TemplateRef<unknown> | undefined;

  private currentLang: string | undefined;
  private loaderTplHandler: TemplateHandler | undefined;
  // Whether we already rendered the view once
  private initialized = false;
  private path: string | undefined;
  private langResolver = new LangResolver();
  private scopeResolver = new ScopeResolver(this.translocoService);

  constructor(
    private translocoService: TranslocoService,
    @Optional() private tpl: TemplateRef<ViewContext>,
    @Optional()
    @Inject(TRANSLOCO_SCOPE)
    private providerScope: MaybeArray<TranslocoScope>,
    @Optional()
    @Inject(TRANSLOCO_LANG)
    private providerLang: string | undefined,
    @Optional()
    @Inject(TRANSLOCO_LOADING_TEMPLATE)
    private providedLoadingTpl: Type<unknown> | string,
    private vcr: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) {}

  ngOnInit() {
    const listenToLangChange = shouldListenToLangChanges(
      this.translocoService,
      this.providerLang || this.inlineLang
    );

    this.subscription = this.translocoService.langChanges$
      .pipe(
        switchMap((activeLang) => {
          const lang = this.langResolver.resolve({
            inline: this.inlineLang,
            provider: this.providerLang,
            active: activeLang,
          });

          return Array.isArray(this.providerScope)
            ? forkJoin(
                (<TranslocoScope[]>this.providerScope).map((providerScope) =>
                  this.resolveScope(lang, providerScope)
                )
              )
            : this.resolveScope(lang, this.providerScope);
        }),
        listenOrNotOperator(listenToLangChange)
      )
      .subscribe(() => {
        this.currentLang = this.langResolver.resolveLangBasedOnScope(
          this.path!
        );
        this.tpl === null
          ? this.simpleStrategy()
          : this.structuralStrategy(this.currentLang, this.inlineRead);
        this.cdr.markForCheck();
        this.initialized = true;
      });

    const loadingTpl = this.getLoadingTpl();
    if (!this.initialized && loadingTpl) {
      this.loaderTplHandler = new TemplateHandler(loadingTpl, this.vcr);
      this.loaderTplHandler.attachView();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // We need to support dynamic keys/params, so if this is not the first change CD cycle
    // we need to run the function again in order to update the value
    const notInit = Object.keys(changes).some((v) => !changes[v].firstChange);
    notInit && this.simpleStrategy();
  }

  private simpleStrategy() {
    this.detachLoader();
    this.host.nativeElement.innerText = this.translocoService.translate(
      this.key!,
      this.params,
      this.currentLang
    );
  }

  private structuralStrategy(lang: string, read?: string) {
    this.translationMemo = {};

    if (this.view) {
      // when the lang changes we need to change the reference so Angular will update the view
      this.view.context['$implicit'] = this.getTranslateFn(lang, read);
      this.view.context['currentLang'] = this.currentLang!;
    } else {
      this.detachLoader();
      this.view = this.vcr.createEmbeddedView(this.tpl, {
        $implicit: this.getTranslateFn(lang, read),
        currentLang: this.currentLang!,
      });
    }
  }

  private getTranslateFn(lang: string, read: string | undefined): TranslateFn {
    return (key: string, params?: HashMap) => {
      const withRead = read ? `${read}.${key}` : key;
      const withParams = params
        ? `${withRead}${JSON.stringify(params)}`
        : withRead;

      if (
        Object.prototype.hasOwnProperty.call(this.translationMemo, withParams)
      ) {
        return this.translationMemo[withParams].value;
      }

      this.translationMemo[withParams] = {
        params,
        value: this.translocoService.translate(withRead, params, lang),
      };

      return this.translationMemo[withParams].value;
    };
  }

  private getLoadingTpl(): View {
    return this.inlineTpl || this.providedLoadingTpl;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private detachLoader() {
    this.loaderTplHandler?.detachView();
  }

  private resolveScope(
    lang: string,
    providerScope: TranslocoScope
  ): Observable<Translation | Translation[]> {
    const resolvedScope = this.scopeResolver.resolve({
      inline: this.inlineScope,
      provider: providerScope,
    });
    this.path = this.langResolver.resolveLangPath(lang, resolvedScope);
    const inlineLoader = resolveInlineLoader(providerScope, resolvedScope);

    return this.translocoService._loadDependencies(this.path, inlineLoader);
  }
}
