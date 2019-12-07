import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, from, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, map, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { DefaultLoader, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_TRANSPILER, TranslocoTranspiler } from './transloco.transpiler';
import {
  AvailableLangs,
  HashMap,
  InlineLoader,
  LoadOptions,
  SetTranslationOptions,
  TranslateParams,
  Translation,
  TranslocoEvents
} from './types';
import { flatten, getValue, isString, size, toCamelCase, unflatten, isNil } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import {
  TRANSLOCO_MISSING_HANDLER,
  TranslocoMissingHandler,
  TranslocoMissingHandlerData
} from './transloco-missing-handler';
import { TRANSLOCO_INTERCEPTOR, TranslocoInterceptor } from './transloco.interceptor';
import { TRANSLOCO_FALLBACK_STRATEGY, TranslocoFallbackStrategy } from './transloco-fallback-strategy';
import { mergeConfig } from './merge-config';
import { getEventPayload, getLangFromScope, getScopeFromLang } from './shared';
import { getFallbacksLoaders } from './get-fallbacks-loaders';
import { resolveLoader } from './resolve-loader';

let service: TranslocoService;

export function translate<T = any>(key: TranslateParams, params: HashMap = {}, lang?: string): T {
  return service.translate(key, params, lang);
}

@Injectable({ providedIn: 'root' })
export class TranslocoService implements OnDestroy {
  private subscription: Subscription;
  private translations = new Map<string, Translation>();
  private cache = new Map<string, Observable<Translation>>();
  private firstFallbackLang: string | null = null;
  private defaultLang: string;
  private mergedConfig: TranslocoConfig;
  private availableLangs: AvailableLangs = [];
  private isResolvedMissingOnce = false;
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
    this.mergedConfig = mergeConfig(defaultConfig, userConfig);

    this.setAvailableLangs(this.mergedConfig.availableLangs);
    this.setFallbackLangForMissingTranslation(this.mergedConfig);
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

  /**
   * Gets the available languages.
   *
   * @returns
   * An array of the available languages. Can be either a `string[]` or a `{ id: string; label: string }[]`
   * depending on how the available languages are set in your module.
   */
  getAvailableLangs() {
    return this.availableLangs;
  }

  load(path: string, options: LoadOptions = {}): Observable<Translation> {
    if (this.cache.has(path) === false) {
      let loadTranslation: Observable<Translation | { translation: Translation; lang: string }[]>;
      const isScope = this._isLangScoped(path);
      const scope = isScope ? getScopeFromLang(path) : null;
      if (this.useFallbackTranslation(path)) {
        // if the path is scope the fallback should be `scope/fallbackLang`;
        const fallback = isScope ? `${scope}/${this.firstFallbackLang}` : this.firstFallbackLang;

        const loaders = getFallbacksLoaders(path, fallback, this.loader, options.inlineLoader, { scope });
        loadTranslation = forkJoin(loaders);
      } else {
        const loader = resolveLoader(path, this.loader, options.inlineLoader, { scope });
        loadTranslation = from(loader);
      }

      const load$ = loadTranslation.pipe(
        retry(this.config.failedRetries),
        catchError(() => this.handleFailure(path, options)),
        tap(translation => {
          if (Array.isArray(translation)) {
            translation.forEach(t => {
              this.handleSuccess(t.lang, t.translation);
              // Save the fallback in cache so we'll not create a redundant request
              if (t.lang !== path) {
                this.cache.set(t.lang, of({}));
              }
            });
            return;
          }
          this.handleSuccess(path, translation);
        }),
        shareReplay(1)
      );

      this.cache.set(path, load$);
    }

    return this.cache.get(path);
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
    let resolveLang = lang;
    let scope;

    // If lang is scope we need to check the following cases:
    // todos/es => in this case we should take `es` as lang
    // todos => in this case we should set the active lang as lang
    if (this._isLangScoped(lang)) {
      // en for example
      const langFromScope = getLangFromScope(lang);
      // en is lang
      const hasLang = this.isLang(langFromScope);
      // take en
      resolveLang = hasLang ? langFromScope : this.getActiveLang();
      // find the scope
      scope = this.getMappedScope(hasLang ? getScopeFromLang(lang) : lang);
    }

    if (Array.isArray(key)) {
      return key.map(k => this.translate(scope ? `${scope}.${k}` : k, params, resolveLang)) as any;
    }

    key = scope ? `${scope}.${key}` : key;

    if (!key) {
      return this.missingHandler.handle(key, this.getMissingHandlerData());
    }

    const translation = this.getTranslation(resolveLang);
    const value = translation[key];

    if (!value) {
      return this._handleMissingKey(key, value, params);
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
    if (isNil(lang)) {
      return this.langChanges$.pipe(switchMap(lang => load(lang)));
    }

    if (this.isLang(lang) || this.isScopeWithLang(lang)) {
      return load(lang);
    }
    // it's a scope
    const scope = lang;
    return this.langChanges$.pipe(switchMap(lang => load(`${scope}/${lang}`)));
  }

  /**
   * Whether the scope with lang
   *
   * @example
   *
   * todos/en => true
   * todos => false
   */
  private isScopeWithLang(lang: string) {
    return this.isLang(getLangFromScope(lang));
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
    const value = getValue(unflatten(translation), key);
    return this.parser.transpile(value, params, translation);
  }

  selectTranslateObject<T = any>(key: TranslateParams, params?: HashMap, lang?: string): Observable<T> {
    return this.selectTranslate(key, params, lang, true);
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
      const key = this.getMappedScope(scope);
      flattenScopeOrTranslation = flatten({ [key]: translation });
    }

    const currentLang = scope ? getLangFromScope(lang) : lang;

    const mergedTranslation = {
      ...(mergedOptions.merge && this.getTranslation(currentLang)),
      ...flattenScopeOrTranslation
    };

    const flattenTranslation = this.mergedConfig.flatten.aot ? mergedTranslation : flatten(mergedTranslation);
    const withHook = this.interceptor.preSaveTranslation(flattenTranslation, currentLang);

    this.translations.set(currentLang, withHook);
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
    const withHook = this.interceptor.preSaveTranslationKey(key, value, lang);
    const newValue = {
      ...this.getTranslation(lang),
      [key]: withHook
    };

    this.setTranslation(newValue, lang);
  }

  /**
   * Sets the fallback lang for the currently active language
   * @param fallbackLang
   */
  setFallbackLangForMissingTranslation({ fallbackLang }: TranslocoConfig): void {
    if (this.useFallbackTranslation && fallbackLang) {
      this.firstFallbackLang = Array.isArray(fallbackLang) ? fallbackLang[0] : fallbackLang;
    }
  }

  /**
   * @internal
   */
  _handleMissingKey(key: string, value: any, params?: HashMap) {
    if (this.config.missingHandler.allowEmpty && value === '') {
      return '';
    }

    if (this.useFallbackTranslation() && !this.isResolvedMissingOnce) {
      this.isResolvedMissingOnce = true;
      const value = this.translate(key, params, this.firstFallbackLang);
      this.isResolvedMissingOnce = false;
      return value;
    }

    return this.missingHandler.handle(key, this.getMissingHandlerData());
  }

  /**
   * @internal
   */
  _isLangScoped(lang: string) {
    return this.getAvailableLangsIds().indexOf(lang) === -1;
  }

  /**
   * Checks if a given string is one of the specified available languages.
   * @returns
   * True if the given string is an available language.
   * False if the given string is not an available language.
   */
  isLang(lang: string): boolean {
    return this.getAvailableLangsIds().indexOf(lang) !== -1;
  }

  /**
   * @internal
   *
   * We always want to make sure the global lang is loaded
   * before loading the scope since you can access both via the pipe/directive.
   */
  _loadDependencies(path: string, inlineLoader?: InlineLoader): Observable<Translation | Translation[]> {
    const mainLang = getLangFromScope(path);

    if (this._isLangScoped(path) && !this.isLoadedTranslation(mainLang)) {
      return combineLatest(this.load(mainLang), this.load(path, { inlineLoader }));
    }
    return this.load(path, { inlineLoader });
  }

  /**
   * @internal
   */
  _completeScopeWithLang(langOrScope: string) {
    if (this._isLangScoped(langOrScope) && !this.isLang(getLangFromScope(langOrScope))) {
      return `${langOrScope}/${this.getActiveLang()}`;
    }
    return langOrScope;
  }

  /**
   * @internal
   */
  _setScopeAlias(scope: string, alias: string) {
    if (!this.mergedConfig.scopeMapping) {
      this.mergedConfig.scopeMapping = {};
    }
    this.mergedConfig.scopeMapping[scope] = alias;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private isLoadedTranslation(lang: string) {
    return size(this.getTranslation(lang));
  }

  private getAvailableLangsIds(): string[] {
    const first = this.getAvailableLangs()[0];

    if (isString(first)) {
      return this.getAvailableLangs() as string[];
    }

    return (this.getAvailableLangs() as { id: string }[]).map(l => l.id);
  }

  private getMissingHandlerData(): TranslocoMissingHandlerData {
    return {
      ...this.config,
      activeLang: this.getActiveLang(),
      availableLangs: this.availableLangs,
      defaultLang: this.defaultLang
    };
  }

  private useFallbackTranslation(lang?: string) {
    return this.config.missingHandler.useFallbackTranslation && lang !== this.firstFallbackLang;
  }

  private handleSuccess(lang: string, translation: Translation) {
    this.setTranslation(translation, lang, { emitChange: false });
    if (this.failedLangs.has(lang) === false) {
      this.events.next({
        wasFailure: !!this.failedLangs.size,
        type: 'translationLoadSuccess',
        payload: getEventPayload(lang)
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
      payload: getEventPayload(lang)
    });

    return this.load(resolveLang);
  }

  private getMappedScope(scope: string): string {
    const { scopeMapping = {} } = this.config;
    return scopeMapping[scope] || toCamelCase(scope);
  }
}
