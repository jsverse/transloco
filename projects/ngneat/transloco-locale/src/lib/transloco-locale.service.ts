import { Injectable, Inject } from '@angular/core';
import { TranslocoService, HashMap } from '@ngneat/transloco';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { isLocaleFormat } from './helpers';
import { LOCALE_LANG_MAPPING, LOCALE_DEFAULT_LOCALE } from './transloco-locale.config';
import { Locale } from './transloco-locale.types';

@Injectable({
  providedIn: 'root'
})
export class TranslocoLocaleService {
  localeChanges$: Observable<Locale>;
  private locale: BehaviorSubject<Locale>;
  private _locale: any;

  constructor(
    private translocoService: TranslocoService,
    @Inject(LOCALE_LANG_MAPPING) private langLocaleMapping: HashMap<Locale>,
    @Inject(LOCALE_DEFAULT_LOCALE) private defaultLocale: Locale
  ) {
    this._locale = defaultLocale || this.toLocale(this.translocoService.getActiveLang());
    this.locale = new BehaviorSubject(this._locale);
    this.localeChanges$ = this.locale.asObservable().pipe(distinctUntilChanged());

    translocoService.langChanges$
      .pipe(
        map(this.toLocale.bind(this)),
        filter(lang => !!lang)
      )
      .subscribe(this.setLocale.bind(this));
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
    if (this.langLocaleMapping[val]) {
      return this.langLocaleMapping[val];
    }

    return null;
  }
}
