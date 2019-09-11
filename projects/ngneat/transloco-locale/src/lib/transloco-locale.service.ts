import { Injectable, Inject } from '@angular/core';
import { TranslocoService, HashMap } from '@ngneat/transloco';
import { Observable, ReplaySubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { isLocaleFormat } from './helpers';
import { LOCALE_LANG_MAPPING } from './transloco-locale.config';
import { Locale } from './transloco-locale.types';

@Injectable({
  providedIn: 'root'
})
export class TranslocoLocaleService {
  localeChanges$: Observable<Locale>;
  private locale = new ReplaySubject<Locale>(1);
  private _locale: any;

  constructor(
    private translocoService: TranslocoService,
    @Inject(LOCALE_LANG_MAPPING) private langLocaleMapping: HashMap<Locale>
  ) {
    translocoService.langChanges$.pipe(map(this.toLocale.bind(this))).subscribe(this.setLocale.bind(this));
    this.localeChanges$ = this.locale.asObservable().pipe(distinctUntilChanged());
  }

  getLocale() {
    return this._locale;
  }

  setLocale(locale: Locale) {
    if (!isLocaleFormat(locale)) {
      throw new Error(`Given lang: ${locale} is not in a locale format`);
    }
    this.locale.next(locale);
    this._locale = locale;
  }

  private toLocale(val: string | Locale): Locale | null {
    if (isLocaleFormat(val)) {
      return val;
    }
    return this.langLocaleMapping[val] || null;
  }
}
