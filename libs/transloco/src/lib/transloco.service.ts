import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  forkJoin,
  from,
  Observable,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import {
  catchError,
  map,
  retry,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';

import {
  DefaultLoader,
  TRANSLOCO_LOADER,
  TranslocoLoader,
} from './transloco.loader';
import {
  TRANSLOCO_TRANSPILER,
  TranslocoTranspiler,
} from './transloco.transpiler';
import {
  AvailableLangs,
  HashMap,
  InlineLoader,
  LoadOptions,
  ProviderScope,
  SetTranslationOptions,
  TranslateObjectParams,
  TranslateParams,
  Translation,
  TranslocoEvents,
  TranslocoScope,
} from './types';
import {
  flatten,
  isEmpty,
  isNil,
  isScopeObject,
  isString,
  size,
  toCamelCase,
  unflatten,
} from './helpers';
import { TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import {
  TRANSLOCO_MISSING_HANDLER,
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
} from './transloco-missing-handler';
import {
  TRANSLOCO_INTERCEPTOR,
  TranslocoInterceptor,
} from './transloco.interceptor';
import {
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoFallbackStrategy,
} from './transloco-fallback-strategy';
import {
  getEventPayload,
  getLangFromScope,
  getScopeFromLang,
  resolveInlineLoader,
} from './shared';
import { getFallbacksLoaders } from './get-fallbacks-loaders';
import { resolveLoader } from './resolve-loader';

let service: TranslocoService;

export function translate<T = string>(
  key: TranslateParams,
  params: HashMap = {},
  lang?: string
): T {
  return service.translate<T>(key, params, lang);
}

export function translateObject<T>(
  key: TranslateParams,
  params: HashMap = {},
  lang?: string
): T | T[] {
  return service.translateObject<T>(key, params, lang);
}

@Injectable({ providedIn: 'root' })
export class TranslocoService implements OnDestroy {
  langChanges$: Observable<string>;

  private subscription: Subscription | null = null;
  private translations = new Map<string, Translation>();
  private cache = new Map<string, Observable<Translation>>();
  private firstFallbackLang: string | undefined;
  private defaultLang = '';
  private availableLangs: AvailableLangs = [];
  private isResolvedMissingOnce = false;
  private lang: BehaviorSubject<string>;
  private failedLangs = new Set<string>();
  private events = new Subject<TranslocoEvents>();

  events$ = this.events.asObservable();
  readonly config: TranslocoConfig & {
    scopeMapping?: HashMap<string>;
  };

  constructor(
    @Optional() @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_TRANSPILER) private parser: TranslocoTranspiler,
    @Inject(TRANSLOCO_MISSING_HANDLER)
    private missingHandler: TranslocoMissingHandler,
    @Inject(TRANSLOCO_INTERCEPTOR) private interceptor: TranslocoInterceptor,
    @Inject(TRANSLOCO_CONFIG) userConfig: TranslocoConfig,
    @Inject(TRANSLOCO_FALLBACK_STRATEGY)
    private fallbackStrategy: TranslocoFallbackStrategy
  ) {
    if (!this.loader) {
      this.loader = new DefaultLoader(this.translations);
    }
    service = this;
    this.config = structuredClone(userConfig);

    this.setAvailableLangs(this.config.availableLangs || []);
    this.setFallbackLangForMissingTranslation(this.config);
    this.setDefaultLang(this.config.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    // Don't use distinctUntilChanged as we need the ability to update
    // the value when using setTranslation or setTranslationKeys
    this.langChanges$ = this.lang.asObservable();

    /**
     * When we have a failure, we want to define the next language that succeeded as the active
     */
    this.subscription = this.events$.subscribe((e) => {
      if (e.type === 'translationLoadSuccess' && e.wasFailure) {
        this.setActiveLang(e.payload.langName);
      }
    });
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
    this.parser.onLangChanged?.(lang);
    this.lang.next(lang);
    this.events.next({
      type: 'langChanged',
      payload: getEventPayload(lang),
    });
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
    const cached = this.cache.get(path);
    if (cached) {
      return cached;
    }

    let loadTranslation: Observable<
      Translation | { translation: Translation; lang: string }[]
    >;
    const isScope = this._isLangScoped(path);
    let scope: string;
    if (isScope) {
      scope = getScopeFromLang(path);
    }

    const loadersOptions = {
      path,
      mainLoader: this.loader,
      inlineLoader: options.inlineLoader,
      data: isScope ? { scope: scope! } : undefined,
    };

    if (this.useFallbackTranslation(path)) {
      // if the path is scope the fallback should be `scope/fallbackLang`;
      const fallback = isScope
        ? `${scope!}/${this.firstFallbackLang}`
        : this.firstFallbackLang;

      const loaders = getFallbacksLoaders({
        ...loadersOptions,
        fallbackPath: fallback!,
      });
      loadTranslation = forkJoin(loaders);
    } else {
      const loader = resolveLoader(loadersOptions);
      loadTranslation = from(loader);
    }

    const load$ = loadTranslation.pipe(
      retry(this.config.failedRetries),
      tap((translation) => {
        if (Array.isArray(translation)) {
          translation.forEach((t) => {
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
      catchError((error) => {
        if (!this.config.prodMode) {
          console.error(`Error while trying to load "${path}"`, error);
        }

        return this.handleFailure(path, options);
      }),
      shareReplay(1)
    );

    this.cache.set(path, load$);

    return load$;
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
  translate<T = string>(
    key: TranslateParams,
    params: HashMap = {},
    lang = this.getActiveLang()
  ): T {
    if (!key) return key as any;

    const { scope, resolveLang } = this.resolveLangAndScope(lang);

    if (Array.isArray(key)) {
      return key.map((k) =>
        this.translate(scope ? `${scope}.${k}` : k, params, resolveLang)
      ) as any;
    }

    key = scope ? `${scope}.${key}` : key;

    const translation = this.getTranslation(resolveLang);
    const value = translation[key];

    if (!value) {
      return this._handleMissingKey(key, value, params);
    }

    return this.parser.transpile(value, params, translation, key);
  }

  /**
   * Gets the translated value of a key as observable
   *
   * @example
   *
   * selectTranslate<string>('hello').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, 'es').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, 'todos').subscribe(value => ...)
   * selectTranslate<string>('hello', {}, { scope: 'todos' }).subscribe(value => ...)
   *
   */
  selectTranslate<T = any>(
    key: TranslateParams,
    params?: HashMap,
    lang?: string | TranslocoScope,
    _isObject = false
  ): Observable<T> {
    let inlineLoader: InlineLoader | undefined;
    const load = (lang: string, options?: LoadOptions) =>
      this.load(lang, options).pipe(
        map(() =>
          _isObject
            ? this.translateObject(key, params, lang)
            : this.translate(key, params, lang)
        )
      );
    if (isNil(lang)) {
      return this.langChanges$.pipe(switchMap((lang) => load(lang)));
    }

    if (isScopeObject(lang)) {
      // it's a scope object.
      const providerScope = lang as ProviderScope;
      lang = providerScope.scope;
      inlineLoader = resolveInlineLoader(providerScope, providerScope.scope);
    }

    lang = lang as string;
    if (this.isLang(lang) || this.isScopeWithLang(lang)) {
      return load(lang);
    }
    // it's a scope
    const scope = lang;
    return this.langChanges$.pipe(
      switchMap((lang) => load(`${scope}/${lang}`, { inlineLoader }))
    );
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
  translateObject<T = any>(key: string, params?: HashMap, lang?: string): T;
  translateObject<T = any>(key: string[], params?: HashMap, lang?: string): T[];
  translateObject<T = any>(
    key: TranslateParams,
    params?: HashMap,
    lang?: string
  ): T | T[];
  translateObject<T = any>(
    key: HashMap | Map<string, HashMap>,
    params?: null,
    lang?: string
  ): T[];
  translateObject<T = any>(
    key: TranslateObjectParams,
    params: HashMap | null = {},
    lang = this.getActiveLang()
  ): T | T[] {
    if (isString(key) || Array.isArray(key)) {
      const { resolveLang, scope } = this.resolveLangAndScope(lang);
      if (Array.isArray(key)) {
        return key.map((k) =>
          this.translateObject(
            scope ? `${scope}.${k}` : k,
            params!,
            resolveLang
          )
        ) as any;
      }

      const translation = this.getTranslation(resolveLang);
      key = scope ? `${scope}.${key}` : key;

      const value = unflatten(this.getObjectByKey(translation, key));
      /* If an empty object was returned we want to try and translate the key as a string and not an object */
      return isEmpty(value)
        ? this.translate(key, params!, lang)
        : this.parser.transpile(value, params!, translation, key);
    }

    const translations: T[] = [];
    for (const [_key, _params] of this.getEntries(key)) {
      translations.push(this.translateObject(_key, _params, lang));
    }

    return translations;
  }

  selectTranslateObject<T = any>(
    key: string,
    params?: HashMap,
    lang?: string
  ): Observable<T>;
  selectTranslateObject<T = any>(
    key: string[],
    params?: HashMap,
    lang?: string
  ): Observable<T[]>;
  selectTranslateObject<T = any>(
    key: TranslateParams,
    params?: HashMap,
    lang?: string
  ): Observable<T> | Observable<T[]>;
  selectTranslateObject<T = any>(
    key: HashMap | Map<string, HashMap>,
    params?: null,
    lang?: string
  ): Observable<T[]>;
  selectTranslateObject<T = any>(
    key: TranslateObjectParams,
    params?: HashMap | null,
    lang?: string
  ): Observable<T> | Observable<T[]> {
    if (isString(key) || Array.isArray(key)) {
      return this.selectTranslate<T>(key, params!, lang, true);
    }

    const [[firstKey, firstParams], ...rest] = this.getEntries(key);

    /* In order to avoid subscribing multiple times to the load language event by calling selectTranslateObject for each pair,
     * we listen to when the first key has been translated (the language is loaded) and translate the rest synchronously */
    return this.selectTranslateObject<T>(firstKey, firstParams, lang).pipe(
      map((value) => {
        const translations = [value];
        for (const [_key, _params] of rest) {
          translations.push(this.translateObject<T>(_key, _params, lang));
        }

        return translations;
      })
    );
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
  getTranslation(langOrScope: string): Translation;
  getTranslation(langOrScope?: string): Map<string, Translation> | Translation {
    if (langOrScope) {
      if (this.isLang(langOrScope)) {
        return this.translations.get(langOrScope) || {};
      } else {
        // This is a scope, build the scope value from the translation object
        const { scope, resolveLang } = this.resolveLangAndScope(langOrScope);
        const translation = this.translations.get(resolveLang) || {};

        return this.getObjectByKey(translation, scope);
      }
    }

    return this.translations;
  }

  /**
   * Gets an object of translations for a given language
   *
   * @example
   *
   * selectTranslation().subscribe() - will return the current lang translation
   * selectTranslation('es').subscribe()
   * selectTranslation('admin-page').subscribe() - will return the current lang scope translation
   * selectTranslation('admin-page/es').subscribe()
   */
  selectTranslation(lang?: string): Observable<Translation> {
    let language$ = this.langChanges$;
    if (lang) {
      const scopeLangSpecified = getLangFromScope(lang) !== lang;
      if (this.isLang(lang) || scopeLangSpecified) {
        language$ = of(lang);
      } else {
        language$ = this.langChanges$.pipe(
          map((currentLang) => `${lang}/${currentLang}`)
        );
      }
    }

    return language$.pipe(
      switchMap((language) =>
        this.load(language).pipe(map(() => this.getTranslation(language)))
      )
    );
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
  setTranslation(
    translation: Translation,
    lang = this.getActiveLang(),
    options: SetTranslationOptions = {}
  ) {
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
      ...flattenScopeOrTranslation,
    };

    const flattenTranslation = this.config.flatten!.aot
      ? mergedTranslation
      : flatten(mergedTranslation);
    const withHook = this.interceptor.preSaveTranslation(
      flattenTranslation,
      currentLang
    );
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
   * setTranslationKey('key.nested', 'value', 'en', { emitChange: false } )
   */
  setTranslationKey(
    key: string,
    value: string,
    // Todo: Add the lang to the options in v3
    lang = this.getActiveLang(),
    options: Omit<SetTranslationOptions, 'merge'> = {}
  ) {
    const withHook = this.interceptor.preSaveTranslationKey(key, value, lang);
    const newValue = {
      [key]: withHook,
    };

    this.setTranslation(newValue, lang, { ...options, merge: true });
  }

  /**
   * Sets the fallback lang for the currently active language
   * @param fallbackLang
   */
  setFallbackLangForMissingTranslation({
    fallbackLang,
  }: Pick<TranslocoConfig, 'fallbackLang'>) {
    const lang = Array.isArray(fallbackLang) ? fallbackLang[0] : fallbackLang;
    if (fallbackLang && this.useFallbackTranslation(lang)) {
      this.firstFallbackLang = lang!;
    }
  }

  /**
   * @internal
   */
  _handleMissingKey(key: string, value: any, params?: HashMap) {
    if (this.config.missingHandler!.allowEmpty && value === '') {
      return '';
    }

    if (!this.isResolvedMissingOnce && this.useFallbackTranslation()) {
      // We need to set it to true to prevent a loop
      this.isResolvedMissingOnce = true;
      const fallbackValue = this.translate(
        key,
        params,
        this.firstFallbackLang!
      );
      this.isResolvedMissingOnce = false;

      return fallbackValue;
    }

    return this.missingHandler.handle(
      key,
      this.getMissingHandlerData(),
      params
    );
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
  _loadDependencies(
    path: string,
    inlineLoader?: InlineLoader
  ): Observable<Translation | Translation[]> {
    const mainLang = getLangFromScope(path);

    if (this._isLangScoped(path) && !this.isLoadedTranslation(mainLang)) {
      return combineLatest(
        this.load(mainLang),
        this.load(path, { inlineLoader })
      );
    }
    return this.load(path, { inlineLoader });
  }

  /**
   * @internal
   */
  _completeScopeWithLang(langOrScope: string) {
    if (
      this._isLangScoped(langOrScope) &&
      !this.isLang(getLangFromScope(langOrScope))
    ) {
      return `${langOrScope}/${this.getActiveLang()}`;
    }
    return langOrScope;
  }

  /**
   * @internal
   */
  _setScopeAlias(scope: string, alias: string) {
    if (!this.config.scopeMapping) {
      this.config.scopeMapping = {};
    }
    this.config.scopeMapping[scope] = alias;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
      // callback within its `destination` property, preventing classes from being GC'd.
      this.subscription = null;
    }
    // Caretaker note: since this is the root provider, it'll be destroyed when the `NgModuleRef.destroy()` is run.
    // Cached values capture `this`, thus leading to a circular reference and preventing the `TranslocoService` from
    // being GC'd. This would lead to a memory leak when server-side rendering is used since the service is created
    // and destroyed per each HTTP request, but any service is not getting GC'd.
    this.cache.clear();
  }

  private isLoadedTranslation(lang: string) {
    return size(this.getTranslation(lang));
  }

  private getAvailableLangsIds(): string[] {
    const first = this.getAvailableLangs()[0];

    if (isString(first)) {
      return this.getAvailableLangs() as string[];
    }

    return (this.getAvailableLangs() as { id: string }[]).map((l) => l.id);
  }

  private getMissingHandlerData(): TranslocoMissingHandlerData {
    return {
      ...this.config,
      activeLang: this.getActiveLang(),
      availableLangs: this.availableLangs,
      defaultLang: this.defaultLang,
    };
  }

  /**
   * Use a fallback translation set for missing keys of the primary language
   * This is unrelated to the fallback language (which changes the active language)
   */
  private useFallbackTranslation(lang?: string) {
    return (
      this.config.missingHandler!.useFallbackTranslation &&
      lang !== this.firstFallbackLang
    );
  }

  private handleSuccess(lang: string, translation: Translation) {
    this.setTranslation(translation, lang, { emitChange: false });
    this.events.next({
      wasFailure: !!this.failedLangs.size,
      type: 'translationLoadSuccess',
      payload: getEventPayload(lang),
    });
    this.failedLangs.forEach((l) => this.cache.delete(l));
    this.failedLangs.clear();
  }

  private handleFailure(lang: string, loadOptions: LoadOptions) {
    // When starting to load a first choice language, initialize
    // the failed counter and resolve the fallback langs.
    if (isNil(loadOptions.failedCounter)) {
      loadOptions.failedCounter = 0;

      if (!loadOptions.fallbackLangs) {
        loadOptions.fallbackLangs = this.fallbackStrategy.getNextLangs(lang);
      }
    }

    const splitted = lang.split('/');
    const fallbacks = loadOptions.fallbackLangs;
    const nextLang = fallbacks![loadOptions.failedCounter!];
    this.failedLangs.add(lang);

    // This handles the case where a loaded fallback language is requested again
    if (this.cache.has(nextLang)) {
      this.handleSuccess(nextLang, this.getTranslation(nextLang));
      return EMPTY;
    }

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

    loadOptions.failedCounter!++;
    this.events.next({
      type: 'translationLoadFailure',
      payload: getEventPayload(lang),
    });

    return this.load(resolveLang, loadOptions);
  }

  private getMappedScope(scope: string): string {
    const { scopeMapping = {} } = this.config;
    return scopeMapping[scope] || toCamelCase(scope);
  }

  /**
   * If lang is scope we need to check the following cases:
   * todos/es => in this case we should take `es` as lang
   * todos => in this case we should set the active lang as lang
   */
  private resolveLangAndScope(lang: string) {
    let resolveLang = lang;
    let scope;

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

    return { scope, resolveLang };
  }

  private getObjectByKey(translation: Translation, key?: string) {
    const result: Translation = {};
    const prefix = `${key}.`;

    for (const currentKey in translation) {
      if (currentKey.startsWith(prefix)) {
        result[currentKey.replace(prefix, '')] = translation[currentKey];
      }
    }

    return result;
  }

  private getEntries(key: HashMap | Map<string, HashMap>) {
    return key instanceof Map ? key.entries() : Object.entries(key);
  }
}
