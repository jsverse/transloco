import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { catchError, map, retry, shareReplay, tap } from 'rxjs/operators';
import { TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_TRANSPILER, TranslocoTranspiler } from './transloco.transpiler';
import { HashMap, Translation, TranslocoEvents } from './types';
import { getValue, mergeDeep, setValue } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';
import { TRANSLOCO_INTERCEPTOR, TranslocoInterceptor } from './transloco.interceptor';

@Injectable({ providedIn: 'root' })
export class TranslocoService {
  private translations = new Map();
  private cache = new Map<string, Observable<Translation>>();
  private defaultLang: string;
  private mergedConfig: TranslocoConfig;

  private lang: BehaviorSubject<string>;
  langChanges$: Observable<string>;

  private events = new Subject<TranslocoEvents>();
  events$ = this.events.asObservable();

  constructor(
    @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_TRANSPILER) private parser: TranslocoTranspiler,
    @Inject(TRANSLOCO_MISSING_HANDLER) private missingHandler: TranslocoMissingHandler,
    @Inject(TRANSLOCO_INTERCEPTOR) private interceptor: TranslocoInterceptor,
    @Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig
  ) {
    this.mergedConfig = { ...defaultConfig, ...this.userConfig };
    this.setDefaultLang(this.mergedConfig.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    this.langChanges$ = this.lang.asObservable();
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

  setActiveLang(lang: string, options: { load: boolean } = { load: false }) {
    this.lang.next(lang);
    if( options.load ) {
      return this.load(lang);
    }
  }

  load(lang: string): Observable<Translation> {
    if( this.cache.has(lang) === false ) {
      const load$ = from(this.loader.getTranslation(lang)).pipe(
        retry(3),
        catchError(() => {
          if( lang === this.defaultLang ) {
            const errMsg = `Unable to load the default translation file (${lang}), reached maximum retries`;
            throw new Error(errMsg);
          } else {
            /* Clear the failed language from the cache so we will retry to load once asked again */
            this.cache.delete(lang);
            this.events.next({
              type: 'translationLoadFailure',
              payload: {
                lang
              }
            });
          }

          return this.setActiveLang(this.defaultLang, { load: true });
        }),
        tap(translation => {
          if( !this.config.prodMode ) {
            console.log(`%c 🍻 Translation Load Success: ${lang}`, 'background: #fff; color: hotpink;');
          }
          this._setTranslation(lang, translation);
          this.events.next({
            type: 'translationLoadSuccess',
            payload: {
              lang
            }
          });
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
  translate(key: string, params?: HashMap, lang?: string): string;
  translate(key: string[], params?: HashMap, lang?: string): string[];
  translate(key: string | string[], params: HashMap = {}, lang?: string): string | string[] {
    if( Array.isArray(key) ) {
      return key.map(k => this.translate(k, params, lang));
    }

    if( !key ) {
      return this.missingHandler.handle(key, params, this.config);
    }

    const translation = this.translations.get(lang || this.getActiveLang());
    if( !translation ) {
      return '';
    }

    const value = getValue(translation, key);

    if( !value ) {
      return this.missingHandler.handle(key, params, this.config);
    }

    return this.parser.transpile(value, params, translation);
  }

  /**
   * Gets the translated value of a key as observable
   *
   * @example
   * selectTranslate('hello').subscribe(value => {})
   * selectTranslate('hello').subscribe(value => {}, 'es')
   */
  selectTranslate(key: string, params?: HashMap, lang?: string) {
    return this.load(lang || this.getActiveLang()).pipe(map(() => this.translate(key, params, lang)));
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
   * getTranslation('en')
   * getTranslation('admin-page/en')
   */
  getTranslation(lang: string): Translation | undefined {
    return this.translations.get(lang);
  }

  /**
   * Sets or merge a given translation object to current lang
   *
   * @example
   *
   * setTranslation('en', { ... })
   * setTranslation('admin-page/en', { ... })
   * setTranslation(lang, { ... }, { merge: false } )
   */
  setTranslation(lang: string, data: Translation, options: { merge?: boolean } = {}) {
    const defaults = { merge: true };
    const mergedOptions = { ...defaults, ...options };
    const translation = this.getTranslation(lang) || {};
    const merged = mergedOptions.merge ? mergeDeep(translation, data) : data;
    this._setTranslation(lang, merged);
    this.setActiveLang(this.getActiveLang());
  }

  /**
   * Sets translation key with given value.
   *
   * @example
   *
   * setTranslationKey('key', 'value')
   * setTranslationKey('key.nested', 'value')
   * setTranslationKey('key.nested', 'value', 'en')
   */
  setTranslationKey(key: string, value: string, lang = this.getDefaultLang()) {
    const translation = this.getTranslation(lang);
    if( translation ) {
      const withHook = this.interceptor.preSaveTranslationKey(key, value, lang);
      const newValue = setValue(translation, key, withHook);
      this.translations.set(lang, newValue);
      this.setActiveLang(this.getActiveLang());
    }
  }

  private _setTranslation(lang: string, translation: Translation) {
    const withHook = this.interceptor.preSaveTranslation(translation, lang);
    this.translations.set(lang, withHook);
  }
}
