import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable, Subject, of, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, map, retry, shareReplay, tap, switchMap } from 'rxjs/operators';
import { DefaultLoader, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_TRANSPILER, TranslocoTranspiler } from './transloco.transpiler';
import { HashMap, TranslateParams, Translation, TranslocoEvents } from './types';
import {
  getLangFromScope,
  getScopeFromLang,
  getValue,
  isEmpty,
  isFunction,
  mergeDeep,
  setValue,
  size,
  toCamelCase,
  getPipeValue
} from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';
import { TRANSLOCO_INTERCEPTOR, TranslocoInterceptor } from './transloco.interceptor';
import { TRANSLOCO_FALLBACK_STRATEGY, TranslocoFallbackStrategy } from './transloco-fallback-strategy';

let service: TranslocoService;

export function translate<T = any>(key: TranslateParams, params: HashMap = {}, lang?: string): T {
  return service.translate(key, params, lang);
}

@Injectable({ providedIn: 'root' })
export class TranslocoService implements OnDestroy {
  private subscription: Subscription;
  private translations = new Map<string, Translation>();
  private cache = new Map<string, Observable<Translation>>();
  private defaultLang: string;
  private mergedConfig: TranslocoConfig;

  private lang: BehaviorSubject<string>;
  langChanges$: Observable<string>;

  private events = new Subject<TranslocoEvents>();
  events$ = this.events.asObservable();

  private failedCounter = 0;
  private failedLangs = new Set<string>();

  constructor(
    @Optional() @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_TRANSPILER) private parser: TranslocoTranspiler,
    @Inject(TRANSLOCO_MISSING_HANDLER) private missingHandler: TranslocoMissingHandler,
    @Inject(TRANSLOCO_INTERCEPTOR) private interceptor: TranslocoInterceptor,
    @Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig,
    @Inject(TRANSLOCO_FALLBACK_STRATEGY) private fallbackStrategy: TranslocoFallbackStrategy
  ) {
    if (!this.loader) {
      this.loader = new DefaultLoader(this.translations);
    }
    service = this;
    this.mergedConfig = { ...defaultConfig, ...this.userConfig };

    this.setDefaultLang(this.mergedConfig.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    this.langChanges$ = this.lang.asObservable().pipe(distinctUntilChanged());

    /**
     * When we have a failure, we want to define the next language that succeeded as the active
     */
    this.subscription = this.events$.subscribe(e => {
      if (e.type === 'translationLoadSuccess' && e.wasFailure) {
        // Handle scoped lang
        const lang = getLangFromScope(e.payload.lang);
        this.setActiveLang(lang);
      }
    });
  }

  get isSharedScope(): boolean {
    return this.config.scopeStrategy === 'shared';
  }

  get config(): TranslocoConfig {
    return this.mergedConfig;
  }

  getDefaultLang() {
    return this.defaultLang;
  }

  setDefaultLang(lang: string) {
    this.defaultLang = lang;
  }

  getActiveLang() {
    return this.lang.getValue();
  }

  setActiveLang(lang: string) {
    this.lang.next(lang);
    return this;
  }

  load(lang: string, options?: { fallbackLangs: string[] | null }): Observable<Translation> {
    if (this.cache.has(lang) === false) {
      const mergedOptions = { ...{ fallbackLangs: null }, ...(options || {}) };

      const load$ = from(this.loader.getTranslation(lang)).pipe(
        retry(this.mergedConfig.failedRetries),
        catchError(() => this.handleFailure(lang, mergedOptions)),
        tap(translation => this.handleSuccess(lang, translation)),
        shareReplay(1)
      );

      this.cache.set(lang, load$);
    }

    return this.cache.get(lang);
  }

  /**
   * Gets the instant translated value of a key
   *
   * @example
   *
   * translate<string>('hello')
   * translate('hello', { value: 'value' })
   * translate<string[]>(['hello', 'key'])
   * translate(t => t.a.b.c);
   * translate('hello', { }, 'en')
   * translate('hello-from-scope', { }, 'my-scope|scoped')
   */
  translate<T = any>(key: TranslateParams, params: HashMap = {}, lang?: string): T {
    const withScope = this.completeScopeWithLang(lang);

    if (Array.isArray(key)) {
      return key.map(k => this.translate(k, params, withScope)) as any;
    }

    if (!key) {
      return this.missingHandler.handle(key as string, params, this.config);
    }

    const translation = this.translations.get(withScope || this.getActiveLang());
    if (!translation) {
      return '' as any;
    }

    const value = isFunction(key) ? key(translation as any, params) : getValue(translation, key);

    if (!value) {
      if (this.mergedConfig.missingHandler.allowEmpty && value === '') {
        return '' as any;
      }

      return this.missingHandler.handle(key, params, this.config);
    }

    return this.parser.transpile(value, params, translation) as any;
  }

  /**
   * Gets the translated value of a key as observable
   *
   * @example
   *
   * selectTranslate<string>('hello').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, 'es').subscribe(value => ...)
   */
  selectTranslate<T = any>(key: TranslateParams, params?: HashMap<any>, lang?: string): Observable<T> {
    const withScopeOrLang = this.completeScopeWithLang(lang);
    const load = lang => this.load(lang).pipe(map(() => this.translate(key, params, lang)));
    if (withScopeOrLang) {
      return load(withScopeOrLang);
    } else {
      // if the user doesn't pass lang, we need to listen to lang changes and update the value accordingly
      return this.langChanges$.pipe(switchMap(lang => load(lang)));
    }
  }

  /**
   *  Translate a given value
   *
   *  @example
   *  transpile('Hello {{ value }}', { value: 'World' })
   *  transpile('Hello {{ value }}', { value: 'World' }, 'es')
   */
  transpile(value: string, params: HashMap = {}, lang = this.getActiveLang()): string {
    const translation = this.translations.get(lang);
    return this.parser.transpile(value, params, translation);
  }

  /**
   * Gets an object of translations for a given language
   *
   * @example
   *
   * getTranslation()
   * getTranslation('en')
   * getTranslation('admin-page/en')
   */
  getTranslation(): Map<string, Translation>;
  getTranslation(lang: string): Translation;
  getTranslation(lang?: string): Map<string, Translation> | Translation {
    return lang ? this.translations.get(lang) || {} : this.translations;
  }

  /**
   * Gets an object of translations for a given language
   *
   * @example
   *
   * selectTranslation().subscribe()
   * selectTranslation('es').subscribe()
   */
  selectTranslation(lang?: string): Observable<Translation> {
    const language = lang || this.getActiveLang();
    return this.load(language).pipe(map(() => this.getTranslation(language)));
  }

  /**
   * Sets or merge a given translation object to current lang
   *
   * @example
   *
   * setTranslation({ ... })
   * setTranslation({ ... }, 'en')
   * setTranslation({ ... }, 'admin-page/en', { merge: false } )
   */
  setTranslation(
    data: Translation,
    lang = this.getActiveLang(),
    options: { merge?: boolean; emitChange?: boolean } = {}
  ) {
    const defaults = { merge: true, emitChange: true };
    const mergedOptions = { ...defaults, ...options };
    const translation = this.getTranslation(lang) || {};
    const merged = mergedOptions.merge ? mergeDeep(translation, data) : data;
    this._setTranslation(lang, merged);
    mergedOptions.emitChange && this.setActiveLang(this.getActiveLang());
  }

  /**
   * Sets translation key with given value
   *
   * @example
   *
   * setTranslationKey('key', 'value')
   * setTranslationKey('key.nested', 'value')
   * setTranslationKey('key.nested', 'value', 'en')
   */
  setTranslationKey(key: string, value: string, lang = this.getActiveLang()) {
    const translation = this.getTranslation(lang);
    if (!isEmpty(translation)) {
      const withHook = this.interceptor.preSaveTranslationKey(key, value, lang);
      const newValue = setValue(translation, key, withHook);
      this.setTranslation(newValue, lang);
    }
  }

  /**
   * @internal
   * When using the shared scope strategy you always want to make sure the global lang  is loaded
   * before loading the scope since you can access both via the pipe/directive.
   */
  _loadDependencies(langName: string): Observable<Translation | Translation[]> {
    const split = langName.split('/');
    const [lang] = split.slice(-1);
    if (split.length > 1 && this.isSharedScope && !size(this.getTranslation(lang))) {
      return combineLatest(this.load(lang), this.load(langName));
    }

    return this.load(langName);
  }

  private completeScopeWithLang(lang: string) {
    const [isScoped, value] = getPipeValue(lang, 'scoped');
    if (isScoped) {
      lang = `${value}/${this.getActiveLang()}`;
    }

    return lang;
  }

  private _setTranslation(lang: string, translation: Translation) {
    const withHook = this.interceptor.preSaveTranslation(translation, lang);
    this.translations.set(lang, withHook);
    const { scopeStrategy, scopeMapping = {} } = this.config;
    const currLang = getLangFromScope(lang);
    const scope = getScopeFromLang(lang);
    if (scope && scopeStrategy === 'shared') {
      const activeLang = this.getTranslation(currLang);
      const key = scopeMapping[scope] || toCamelCase(scope);
      const merged = setValue(activeLang, key, withHook);
      this.translations.set(currLang, merged);
    }
  }

  private handleSuccess(lang: string, translation: Translation) {
    this.setTranslation(translation, lang, { emitChange: false });
    if (this.failedLangs.has(lang) === false) {
      if (!this.config.prodMode) {
        console.log(`%c 🍻 Translation Load Success: ${lang}`, 'background: #fff; color: hotpink;');
      }

      this.events.next({
        wasFailure: !!this.failedLangs.size,
        type: 'translationLoadSuccess',
        payload: {
          lang
        }
      });

      this.failedCounter = 0;
    } else {
      this.cache.delete(lang);
      this.failedLangs.delete(lang);
    }
  }

  private handleFailure(lang: string, mergedOptions) {
    const splitted = lang.split('/');

    this.failedLangs.add(lang);
    const fallbacks = mergedOptions.fallbackLangs || this.fallbackStrategy.getNextLangs(lang);
    const nextLang = fallbacks[this.failedCounter];

    const isFallbackLang = nextLang === splitted[splitted.length - 1];

    if (!nextLang || isFallbackLang) {
      let msg = `Unable to load translation and all the fallback languages`;
      if (splitted.length > 1) {
        msg += `, did you misspelled the scope name?`;
      }

      throw new Error(msg);
    }

    let resolveLang = nextLang;
    // if it's scoped lang
    if (splitted.length > 1) {
      // We need to resolve it to:
      // todos/langNotExists => todos/nextLang
      splitted[splitted.length - 1] = nextLang;
      resolveLang = splitted.join('/');
    }

    this.failedCounter++;
    this.events.next({
      type: 'translationLoadFailure',
      payload: {
        lang
      }
    });

    return this.load(resolveLang);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
