import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, retry, shareReplay, tap } from 'rxjs/operators';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_PARSER, TranslocoParser } from './transloco.parser';
import { HashMap } from './types';
import { getValue, mergeDeep } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';

@Injectable({
  providedIn: 'root'
})
export class TranslocoService {
  private langs = new Map();
  private cache = new Map<string, Observable<HashMap<any>>>();
  private defaultLang: string;
  private mergedConfig: TranslocoConfig;

  private lang: BehaviorSubject<string>;
  /** Notifies when the lang changes */
  lang$: Observable<string>;

  private translationLoaded = new Subject<{ lang: string }>();
  /** Notifies when the lang loaded */
  translationLoaded$ = this.translationLoaded.asObservable();

  private translationLoadFailed = new Subject<{ lang: string }>();
  /** Notifies when the lang loading failed */
  translationLoadFailed$ = this.translationLoadFailed.asObservable();

  constructor(
    @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_PARSER) private parser: TranslocoParser,
    @Inject(TRANSLOCO_MISSING_HANDLER) private missingHandler: TranslocoMissingHandler,
    @Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig
  ) {
    this.mergedConfig = { ...defaultConfig, ...this.userConfig };
    this.setDefaultLang(this.mergedConfig.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    this.lang$ = this.lang.asObservable();
  }

  get config(): TranslocoConfig {
    return this.mergedConfig;
  }

  getDefaultLang() {
    return this.defaultLang;
  }

  /**
   * This language will be used as a fallback when a translation isn't found in the current language
   */
  setDefaultLang(lang: string) {
    this.defaultLang = lang;
  }

  getActiveLang() {
    return this.lang.getValue();
  }

  /**
   * Changes the lang currently used
   */
  setActiveLang(lang: string) {
    this.lang.next(lang);
  }

  /**
   * Load and change the lang currently used
   */
  setLangAndLoad(lang: string) {
    this.setActiveLang(lang);
    return this._load(lang);
  }

  /**
   *
   * @internal
   */
  _load(lang: string): Observable<Translation> {
    if (this.cache.has(lang) === false) {
      const load$ = from(this.loader.getTranslation(lang)).pipe(
        retry(3),
        catchError(() => {
          if (lang === this.defaultLang) {
            const errMsg = `Unable to load the default translation file (${lang}), reached maximum retries`;
            throw new Error(errMsg);
          } else {
            /* Clear the failed language from the cache so we will retry to load once asked again */
            this.cache.delete(lang);
            this.translationLoadFailed.next({ lang });
          }
          return this.setLangAndLoad(this.defaultLang);
        }),
        tap(value => {
          this.langs.set(lang, value);
          this.translationLoaded.next({ lang });
        }),
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
   * translate('hello')
   * translate('hello', { value: 'value' })
   * translate(['hello', 'key'])
   * translate('hello', { }, 'en')
   */
  translate(key: string, params?: HashMap, langName?: string): string;
  translate(key: string[], params?: HashMap, langName?: string): string[];
  translate(key: string | string[], params: HashMap = {}, langName?: string): string | string[] {
    if (Array.isArray(key)) {
      return key.map(k => this.translate(k, params, langName));
    }

    if (!key) {
      return this.missingHandler.handle(key, params, this.config);
    }

    const lang = this.langs.get(langName || this.getActiveLang());
    if (!lang) {
      return '';
    }

    const value = getValue(lang, key);

    if (!value) {
      return this.missingHandler.handle(key, params, this.config);
    }

    return this.parser.parse(value, params, lang);
  }

  /**
   * Gets the translated value of a key as observable
   *
   * @example
   * selectTranslate('hello').subscribe(value => {})
   */
  selectTranslate(key: string, params: HashMap = {}) {
    return this._load(this.getActiveLang()).pipe(
      map(() => {
        return this.translate(key, params);
      })
    );
  }

  /**
   *  Translate a given value
   *
   *  @example
   *  translateValue('Hello {{ value }}', { value: 'World' })
   */
  translateValue(value: string, params: HashMap = {}): string {
    const lang = this.langs.get(this.getActiveLang());
    return this.parser.parse(value, params, lang);
  }

  /**
   * Gets an object of translations for a given language
   */
  getTranslation(lang: string): HashMap<any> {
    return this.langs.get(lang);
  }

  /**
   * Sets or merge a given translation Object to current lang.
   */
  setTranslation(lang: string, translation: Translation, options: { merge: boolean }, scope?: string) {
    const translationKey = this.getTranslationKey(lang, scope);
    const translate = this.langs.get(translationKey);

    this._setTranslate(translationKey, options.merge ? mergeDeep(translate, translation) : translation, scope);
  }

  /**
   * Sets translation key with given value.
   */
  setTranslationKey(lang: string, key: string, value: any, scope?: string) {
    const translationKey = this.getTranslationKey(lang, scope);
    const translate = this.langs.get(translationKey);
    this._setTranslate(translationKey, { ...translate, [key]: value }, scope);
  }

  private _setTranslate(key: string, translate: Translation, scope) {
    if (!translate) {
      return;
    }

    this.langs.set(key, translate);
    // this.cache.set(key, of(translate));
    const activeLang = this.getActiveLang();
    this.getTranslationKey(activeLang, scope) === key && this.setActiveLang(key);
  }

  private getTranslationKey(lang: string, scope?: string) {
    return scope ? `${lang}-${scope}` : lang;
  }
}
