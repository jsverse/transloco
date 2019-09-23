import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable, Subject, Subscription } from 'rxjs';
import { catchError, map, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { DefaultLoader, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_TRANSPILER, TranslocoTranspiler } from './transloco.transpiler';
import { AvailableLangs, HashMap, SetTranslationOptions, TranslateParams, Translation, TranslocoEvents } from './types';
import { getLangFromScope, getScopeFromLang, isString, size, toCamelCase } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';
import { TRANSLOCO_INTERCEPTOR, TranslocoInterceptor } from './transloco.interceptor';
import { TRANSLOCO_FALLBACK_STRATEGY, TranslocoFallbackStrategy } from './transloco-fallback-strategy';
import flatten from 'flat';

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
  private availableLangs: AvailableLangs = [];

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
    this.setAvailableLangs(this.mergedConfig.availableLangs);
    this.setDefaultLang(this.mergedConfig.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    // Don't use distinctUntilChanged as we need the ability to update
    // the value when using setTranslation or setTranslationKeys
    this.langChanges$ = this.lang.asObservable();

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

  setAvailableLangs(langs: AvailableLangs) {
    this.availableLangs = langs;
  }

  getAvailableLangs() {
    return this.availableLangs;
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
   * translate('hello', { }, 'en')
   * translate('scope.someKey', { }, 'en')
   */
  translate<T = any>(key: TranslateParams, params: HashMap = {}, lang = this.getActiveLang()): T {
    const resolveLang = this._isLangScoped(lang) ? this.getActiveLang() : lang;
    if (Array.isArray(key)) {
      return key.map(k => this.translate(k, params, resolveLang)) as any;
    }

    if (!key) {
      return this.missingHandler.handle(key, this.config);
    }

    const translation = this.getTranslation(resolveLang);
    const value = translation[key];

    if (!value) {
      return this.handleMissingKey(key, value);
    }

    return this.parser.transpile(value, params, translation);
  }

  /**
   * Gets the translated value of a key as observable
   *
   * @example
   *
   * selectTranslate<string>('hello').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, 'es').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, 'todos').subscribe(value => ...)
   *
   */
  selectTranslate<T = any>(key: TranslateParams, params?: HashMap, lang?: string, _isObject = false): Observable<T> {
    const load = lang =>
      this.load(lang).pipe(
        map(() => (_isObject ? this.translateObject(key, params, lang) : this.translate(key, params, lang)))
      );
    if (isString(lang)) {
      const langOrScope = this._completeScopeWithLang(lang);
      return load(langOrScope);
    } else {
      // if the user doesn't pass lang, we need to listen to lang changes and update the value accordingly
      return this.langChanges$.pipe(switchMap(lang => load(lang)));
    }
  }

  /**
   * Translate the given path that returns an object
   *
   * @example
   *
   * service.translateObject('path.to.object', {'subpath': { value: 'someValue'}}) => returns translated object
   *
   */
  translateObject<T = any>(key: TranslateParams, params?: HashMap, lang = this.getActiveLang()): T {
    if (Array.isArray(key)) {
      return key.map(k => this.translateObject(k, params, lang)) as any;
    }

    const translation = this.getTranslation(lang);
    // TODO: optimize it (we can build this specific object)
    const value = flatten.unflatten(translation)[key];
    return this.parser.transpile(value, params, translation);
  }

  selectTranslateObject<T = any>(key: TranslateParams, params?: HashMap, lang = this.getActiveLang()): Observable<T> {
    return this.selectTranslate(key, params, lang, true);
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
   * setTranslation({ ... }, 'es', { merge: false } )
   * setTranslation({ ... }, 'todos/en', { merge: false } )
   */
  setTranslation(translation: Translation, lang = this.getActiveLang(), options: SetTranslationOptions = {}) {
    const defaults = { merge: true, emitChange: true };
    const mergedOptions = { ...defaults, ...options };
    const scope = getScopeFromLang(lang);

    /**
     * If this isn't a scope we use the whole translation as is
     * otherwise we need to flat the scope and use it
     */
    let flattenScopeOrTranslation = translation;

    // Merged the scoped language into the active language
    if (scope) {
      const { scopeMapping = {} } = this.config;
      const key = scopeMapping[scope] || toCamelCase(scope);
      flattenScopeOrTranslation = flatten({
        [key]: translation
      });
    }

    const currentLang = scope ? getLangFromScope(lang) : lang;

    const mergedTranslation = {
      ...(mergedOptions.merge && this.getTranslation(currentLang)),
      ...flattenScopeOrTranslation
    };

    const withHook = this.interceptor.preSaveTranslation(mergedTranslation, currentLang);
    const flattenTranslation = flatten(withHook);
    this.translations.set(currentLang, flattenTranslation);
    options.emitChange && this.setActiveLang(this.getActiveLang());
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
    const withHook = this.interceptor.preSaveTranslationKey(key, value, lang);
    const newValue = {
      ...this.getTranslation(lang),
      [key]: withHook
    };
    this.setTranslation(newValue, lang);
  }

  handleMissingKey(key: string, value: any) {
    if (this.mergedConfig.missingHandler.allowEmpty && value === '') {
      return '';
    }

    return this.missingHandler.handle(key, this.config);
  }

  /**
   * @internal
   */
  _isLangScoped(lang: string) {
    return this.getAvailableLangsIds().every(l => l !== lang);
  }

  /**
   * @internal
   *
   * We always want to make sure the global lang is loaded
   * before loading the scope since you can access both via the pipe/directive.
   */
  _loadDependencies(langName: string): Observable<Translation | Translation[]> {
    const split = langName.split('/');
    const [lang] = split.slice(-1);
    if (split.length > 1 && !size(this.getTranslation(lang))) {
      return combineLatest(this.load(lang), this.load(langName));
    }

    return this.load(langName);
  }

  /**
   * @internal
   */
  _completeScopeWithLang(langOrScope: string) {
    return this._isLangScoped(langOrScope) ? `${langOrScope}/${this.getActiveLang()}` : langOrScope;
  }

  private getAvailableLangsIds(): string[] {
    const first = this.getAvailableLangs()[0];

    if (isString(first)) {
      return this.getAvailableLangs() as string[];
    }

    return (this.getAvailableLangs() as { id: string }[]).map(l => l.id);
  }

  private handleSuccess(lang: string, translation: Translation) {
    this.setTranslation(translation, lang, { emitChange: false });
    if (this.failedLangs.has(lang) === false) {
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
