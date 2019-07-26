import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, tap } from 'rxjs/operators';
import { Lang, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_PARSER, TranslocoParser } from './transloco.parser';
import { HashMap } from './types';
import { getValue } from './helpers';
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
  lang$: Observable<string>;

  private translationLoaded = new Subject<{ lang: string }>();
  translationLoaded$ = this.translationLoaded.asObservable();

  constructor(
    @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_PARSER) private parser: TranslocoParser,
    @Inject(TRANSLOCO_MISSING_HANDLER) private missingHandler: TranslocoMissingHandler,
    @Inject(TRANSLOCO_CONFIG) private userConfig: TranslocoConfig
  ) {
    this.mergedConfig = { ...defaultConfig, ...this.userConfig };
    this.setDefaultLang(this.mergedConfig.defaultLang);
    this.lang = new BehaviorSubject<string>(this.getDefaultLang());
    this.lang$ = this.lang.asObservable().pipe(distinctUntilChanged());
  }

  get config(): TranslocoConfig {
    return this.mergedConfig;
  }

  /**
   * Get the active language
   */
  getActiveLang() {
    return this.lang.getValue();
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

  /**
   *
   * @internal
   */
  load(lang: string): Observable<Lang> {
    if( this.cache.has(lang) === false ) {
      const load$ = from(this.loader(lang)).pipe(
        catchError(() => this.load(this.defaultLang)),
        tap(value => {
          this.langs.set(lang, value);
          this.translationLoaded.next({ lang });
        }),
        shareReplay({ refCount: true, bufferSize: 1 })
      );
      this.cache.set(lang, load$);
    }

    return this.cache.get(lang);
  }

  /**
   * Gets the instant translated value of a key
   *
   * @example
   * translate('hello')
   */
  translate(key: string, params: HashMap = {}) {
    if( !key ) {
      return '';
    }

    const lang = this.langs.get(this.getActiveLang());
    if( !lang ) {
      return '';
    }

    const value = getValue(lang, key);

    if( !value ) {
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
    return this.load(this.getActiveLang()).pipe(
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
  translateValue(value: string, params: HashMap = {}) {
    const lang = this.langs.get(this.getActiveLang());
    return this.parser.parse(value, params, lang);
  }

  /**
   * Changes the lang currently used
   */
  setLang(lang: string) {
    this.lang.next(lang);
  }

  /**
   * Load and changes the lang currently used
   */
  setLangAndLoad(lang: string) {
    this.setLang(lang);
    return this.load(lang);
  }

  /**
   *  Returns the current browser lang if available
   */
  getBrowserLang() {
    return (
      (navigator.languages && navigator.languages[0]) || // Chrome / Firefox
      navigator.language || // All browsers
      (navigator as any).userLanguage
    );
  }

  /**
   * Gets an object of translations for a given language
   */
  getTranslation(lang: string) {
    return this.langs.get(lang);
  }
}
