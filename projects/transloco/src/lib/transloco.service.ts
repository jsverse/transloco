import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { TRANSLOCO_LOADER, Lang, Loader } from './transloco.loader';

@Injectable({
  providedIn: 'root'
})
export class TranslocoService {
  private lang = new BehaviorSubject<string>('en');
  lang$ = this.lang.asObservable().pipe(distinctUntilChanged());
  cache = new Map<string, Observable<{ [key: string]: any }>>();

  constructor(@Inject(TRANSLOCO_LOADER) private loader: Loader) {}

  load(lang: string): Observable<Lang> {
    if (this.cache.has(lang) === false) {
      const load$ = from(this.loader(lang)).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
      this.cache.set(lang, load$);
    }

    return this.cache.get(lang);
  }

  setLang(lang: string) {
    this.lang.next(lang);
  }

  setLangAndLoad(lang: string) {
    this.setLang(lang);
    return this.load(lang);
  }
}
