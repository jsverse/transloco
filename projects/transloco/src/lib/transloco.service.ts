import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay, tap } from 'rxjs/operators';
import { TRANSLOCO_LOADER, Lang, TranslocoLoader } from './transloco.loader';
import { TRANSLOCO_PARSER, TranslocoParser } from './transloco.parser';
import { HashMap } from './types';
import { getKey } from './helpers';

@Injectable({
  providedIn: 'root'
})
export class TranslocoService {
  private lang = new BehaviorSubject<string>('en');
  private langs = new Map();

  lang$ = this.lang.asObservable().pipe(distinctUntilChanged());
  cache = new Map<string, Observable<HashMap<any>>>();

  constructor(
    @Inject(TRANSLOCO_LOADER) private loader: TranslocoLoader,
    @Inject(TRANSLOCO_PARSER) private parser: TranslocoParser
  ) {}

  load(lang: string): Observable<Lang> {
    if (this.cache.has(lang) === false) {
      const load$ = from(this.loader(lang)).pipe(
        tap(value => this.langs.set(lang, value)),
        shareReplay({ refCount: true, bufferSize: 1 })
      );
      this.cache.set(lang, load$);
    }

    return this.cache.get(lang);
  }

  translate(key: string, params: HashMap = {}) {
    const value = getKey(this.langs.get(this.activeLang), key);
    return this.parser.parse(value, params);
  }

  translateValue(value: string, params: HashMap = {}) {
    return this.parser.parse(value, params);
  }

  setLang(lang: string) {
    this.lang.next(lang);
  }

  setLangAndLoad(lang: string) {
    this.setLang(lang);
    return this.load(lang);
  }

  private get activeLang() {
    return this.lang.getValue();
  }
}
