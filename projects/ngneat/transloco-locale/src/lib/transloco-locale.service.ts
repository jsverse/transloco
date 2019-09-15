import {Injectable, Inject, OnDestroy} from '@angular/core';
import { TranslocoService, HashMap } from '@ngneat/transloco';
import {Observable, BehaviorSubject, Subscription} from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { isLocaleFormat } from './helpers';
import { LOCALE_LANG_MAPPING, LOCALE_DEFAULT_LOCALE } from './transloco-locale.config';
import { Locale } from './transloco-locale.types';

@Injectable({
  providedIn: 'root'
})
export class TranslocoLocaleService implements OnDestroy{
  localeChanges$: Observable<Locale>;
  private locale: BehaviorSubject<Locale>;
  private _locale: Locale | null;
  private subscription: Subscription;

  constructor(
    private translocoService: TranslocoService,
    @Inject(LOCALE_LANG_MAPPING) private langLocaleMapping: HashMap<Locale>,
    @Inject(LOCALE_DEFAULT_LOCALE) private defaultLocale: Locale
  ) {
    this._locale = defaultLocale || this.toLocale(this.translocoService.getActiveLang());
    this.locale = new BehaviorSubject(this._locale);
    this.localeChanges$ = this.locale.asObservable().pipe(distinctUntilChanged());

    this.subscription = translocoService.langChanges$
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
      console.error(`${locale} isn't a valid locale format`);
      return false;
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
