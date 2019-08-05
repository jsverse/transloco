import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { catchError, map, retry, shareReplay, tap } from 'rxjs/operators';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_PARSER, TranslocoParser } from './transloco.parser';
import { HashMap, TranslocoEvents } from './types';
import { getValue, mergeDeep, setValue } from './helpers';
import { defaultConfig, TRANSLOCO_CONFIG, TranslocoConfig } from './transloco.config';
import { TRANSLOCO_MISSING_HANDLER, TranslocoMissingHandler } from './transloco-missing-handler';

@Injectable({ providedIn: 'root' })
export class TranslocoService {
  private translations = new Map();
  private cache = new Map<string, Observable<Translation>>();
  private defaultLang: string;
  private mergedConfig: TranslocoConfig;

  private lang: BehaviorSubject<string>;
  /** Notifies when the lang changes */
  lang$: Observable<string>;

  private events = new Subject<TranslocoEvents>();
  events$ = this.events.asObservable();

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

  /**
   * This language will be used as a fallback when a translation isn't found in the current language
   */
  getDefaultLang() {
    return this.defaultLang;
  }
  setDefaultLang(lang: string) {
    this.defaultLang = lang;
  }

  /**
   * Changes the lang currently used
   */
  getActiveLang() {
    return this.lang.getValue();
  }
  setActiveLang(lang: string, options: { load: boolean } = { load: false }) {
    this.lang.next(lang);
    if (options.load) {
      return this.load(lang);
    }
  }

  load(lang: string): Observable<Translation> {
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
            this.events.next({
              type: 'translationLoadFailure',
              payload: {
                lang
              }
            });
          }

          return this.setActiveLang(this.defaultLang, { load: true });
        }),
        tap(value => {
          this.translations.set(lang, value);
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
  translate(key: string, params?: HashMap, langName?: string): string;
  translate(key: string[], params?: HashMap, langName?: string): string[];
  translate(key: string | string[], params: HashMap = {}, langName?: string): string | string[] {
    if (Array.isArray(key)) {
      return key.map(k => this.translate(k, params, langName));
    }

    if (!key) {
      return this.missingHandler.handle(key, params, this.config);
    }

    const lang = this.translations.get(langName || this.getActiveLang());
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
  selectTranslate(key: string, params?: HashMap, langName?: string) {
    return this.load(langName || this.getActiveLang()).pipe(map(() => this.translate(key, params, langName)));
  }

  /**
   *  Translate a given value
   *
   *  @example
   *  translateValue('Hello {{ value }}', { value: 'World' })
   */
  translateValue(value: string, params: HashMap = {}): string {
    const lang = this.translations.get(this.getActiveLang());
    return this.parser.parse(value, params, lang);
  }

  /**
   * Gets an object of translations for a given language
   */
  getTranslation(lang: string): Translation | undefined {
    return this.translations.get(lang);
  }

  /**
   * Sets or merge a given translation object to current lang
   *
   * @example
   *
   * setTranslation(lang, { ... })
   * setTranslation(lang, { ... }, { merge: false } )
   */
  setTranslation(lang: string, data: Translation, options: { merge?: boolean } = {}) {
    const defaults = { merge: true };
    const mergedOptions = { ...defaults, ...options };
    const translation = this.getTranslation(lang) || {};
    const merged = mergedOptions.merge ? mergeDeep(translation, data) : data;
    this.translations.set(lang, merged);
    this.setActiveLang(this.getActiveLang());
  }

  /**
   * Sets translation key with given value.
   * @example
   *
   * setTranslationKey('key', 'value')
   * setTranslationKey('key.nested', 'value')
   */
  setTranslationKey(key: string, value: string, lang = this.getDefaultLang()) {
    const translation = this.getTranslation(lang);
    if (translation) {
      const newValue = setValue(translation, key, value);
      this.translations.set(lang, newValue);
      this.setActiveLang(this.getActiveLang());
    }
  }
}
