import {Injectable, Inject, Optional} from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay, tap, map } from 'rxjs/operators';
import { TRANSLOCO_LOADER, Lang, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_PARSER, TranslocoParser } from './transloco.parser';
import { HashMap } from './types';
import { getValue } from './helpers';
import { TRANSLOCO_CONFIG, TranslocoConfig, defaults } from './transloco.config';

@Injectable({
  providedIn: 'root'
})
export class TranslocoService {
  private langs = new Map();
  private cache = new Map<string, Observable<HashMap<any>>>();
  private defaultLang: string;

  private lang: BehaviorSubject<string>;
  lang$: Observable<string>;

  constructor(
    @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_PARSER) private parser: TranslocoParser,
    @Optional() @Inject(TRANSLOCO_CONFIG) config: TranslocoConfig
  ) {
    this.defaultLang = config.defaultLang || defaults.defaultLang;
    this.lang = new BehaviorSubject<string>(this.defaultLang);
    this.lang$ = this.lang.asObservable().pipe(distinctUntilChanged());
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
  setDefaultLang(lang: string) {}

  /**
   *
   * @internal
   */
  load(lang: string): Observable<Lang> {
    if (this.cache.has(lang) === false) {
      const load$ = from(this.loader(lang)).pipe(
        // catchError(() => this.load(this.defaultLang)),
        tap(value => this.langs.set(lang, value)),
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
    const lang = this.langs.get(this.getActiveLang());
    const value = getValue(lang, key);
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
   * Returns an array of currently available langs
   */
  getLangs() {}

  /**
   * Add new langs to the list
   */
  addLangs(langs: string[]) {}

  /**
   * Gets an object of translations for a given language
   */
  getTranslation(lang: string) {
    return this.langs.get(lang);
  }
}
