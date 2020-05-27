import { Injectable, Inject, OnDestroy } from '@angular/core';
import { TranslocoService, HashMap } from '@ngneat/transloco';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { isLocaleFormat, toDate } from './helpers';
import { getDefaultOptions } from './shared';
import {
  LOCALE_LANG_MAPPING,
  LOCALE_DEFAULT_LOCALE,
  LOCALE_CONFIG,
  LocaleConfig,
  LOCALE_CURRENCY_MAPPING
} from './transloco-locale.config';
import {
  TRANSLOCO_DATE_TRANSFORMER,
  TRANSLOCO_NUMBER_TRANSFORMER,
  TranslocoDateTransformer,
  TranslocoNumberTransformer
} from './transloco-locale.transformers';
import { Locale, DateFormatOptions, NumberTypes, Currency, ValidDate } from './transloco-locale.types';

@Injectable({
  providedIn: 'root'
})
export class TranslocoLocaleService implements OnDestroy {
  localeChanges$: Observable<Locale>;
  private locale: BehaviorSubject<Locale>;
  private _locale: Locale | null;
  private subscription: Subscription;

  constructor(
    private translocoService: TranslocoService,
    @Inject(LOCALE_LANG_MAPPING) private langLocaleMapping: HashMap<Locale>,
    @Inject(LOCALE_DEFAULT_LOCALE) private defaultLocale: Locale,
    @Inject(LOCALE_CONFIG) private localeConfig: LocaleConfig,
    @Inject(LOCALE_CURRENCY_MAPPING) private localeCurrencyMapping: HashMap<Currency>,
    @Inject(TRANSLOCO_NUMBER_TRANSFORMER) private numberTransformer: TranslocoNumberTransformer,
    @Inject(TRANSLOCO_DATE_TRANSFORMER) private dateTransformer: TranslocoDateTransformer
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

  /**
   * Transform a date into the locale's date format.
   *
   * The date expression: a `Date` object, a number
   * (milliseconds since UTC epoch), or an ISO string (https://www.w3.org/TR/NOTE-datetime).
   *
   * @example
   *
   * localizeDate(new Date(2019, 9, 7, 12, 0, 0)) // 10/7/2019
   * localizeDate(date, 'en-US', { dateStyle: 'medium', timeStyle: 'medium' }) // Sep 10, 2019, 10:46:12 PM
   * localizeDate(date) 'en-US', { timeZone: 'UTC', timeStyle: 'full' } // 7:40:32 PM Coordinated Universal Time
   * localizeDate(1, 'en-US', { dateStyle: 'medium' }) // Jan 1, 1970
   * localizeDate('2019-02-08', 'en-US', { dateStyle: 'medium' }) // Feb 8, 2019
   */
  localizeDate(date: ValidDate, locale: Locale = this.getLocale(), options?: DateFormatOptions): string {
    options = options ? options : getDefaultOptions(locale, 'date', this.localeConfig);
    return this.dateTransformer.transform(toDate(date), locale, options);
  }

  /**
   * Transform a number into the locale's number format according to the number type.
   *
   * localizeNumber(1234567890, 'decimal') // 1,234,567,890
   * localizeNumber(0.5, 'percent') // 50%
   * localizeNumber(1000, 'currency') // $1,000.00
   */
  localizeNumber(
    value: number | string,
    type: NumberTypes,
    locale: Locale = this.getLocale(),
    options?: Intl.NumberFormatOptions
  ): string {
    options = options ? options : getDefaultOptions(locale, type, this.localeConfig);
    if (type === 'currency') {
      options = { ...options, currency: options.currency || this._resolveCurrencyCode(locale) };
    }
    return this.numberTransformer.transform(value, type, locale, options);
  }

  /**
   * @internal
   */
  _resolveCurrencyCode(locale: Locale = this.getLocale()) {
    return this.localeCurrencyMapping[locale] || 'USD';
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
