import { inject, Injectable, OnDestroy } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { isLocaleFormat, toDate } from './helpers';
import { getDefaultOptions } from './shared';
import {
  TRANSLOCO_LOCALE_CONFIG,
  TRANSLOCO_LOCALE_CURRENCY_MAPPING,
  TRANSLOCO_LOCALE_DEFAULT_CURRENCY,
  TRANSLOCO_LOCALE_DEFAULT_LOCALE,
  TRANSLOCO_LOCALE_LANG_MAPPING,
} from './transloco-locale.config';
import {
  TRANSLOCO_DATE_TRANSFORMER,
  TRANSLOCO_NUMBER_TRANSFORMER,
} from './transloco-locale.transformers';
import {
  DateFormatOptions,
  Locale,
  LocaleConfig,
  NumberStyles,
  ValidDate,
} from './transloco-locale.types';

@Injectable({
  providedIn: 'root',
})
export class TranslocoLocaleService implements OnDestroy {
  private translocoService = inject(TranslocoService);
  private langLocaleMapping = inject(TRANSLOCO_LOCALE_LANG_MAPPING);
  private defaultLocale = inject(TRANSLOCO_LOCALE_DEFAULT_LOCALE);
  private defaultCurrency = inject(TRANSLOCO_LOCALE_DEFAULT_CURRENCY);
  private localeCurrencyMapping = inject(TRANSLOCO_LOCALE_CURRENCY_MAPPING);
  private numberTransformer = inject(TRANSLOCO_NUMBER_TRANSFORMER);
  private dateTransformer = inject(TRANSLOCO_DATE_TRANSFORMER);
  private localeConfig: LocaleConfig = inject(TRANSLOCO_LOCALE_CONFIG);
  private browserLocale = navigator?.language || this.defaultLocale;

  private _locale = '';
  private locale: BehaviorSubject<Locale> = new BehaviorSubject(this._locale);
  private subscription: Subscription | null = null;

  localeChanges$ = this.locale.asObservable().pipe(distinctUntilChanged());

  constructor() {
    // Initialize locale with fallback chain
    this._locale = this.initializeLocale();
    this.locale.next(this._locale);

    // Subscribe to language changes
    this.subscription = this.translocoService.langChanges$
      .pipe(
        map((lang) => this.toLocale(lang)),
        filter(Boolean),
      )
      .subscribe((locale: Locale) => this.setLocale(locale));
  }

  getLocale() {
    return this._locale;
  }

  setLocale(locale: Locale) {
    if (!isLocaleFormat(locale)) {
      console.error(`${locale} isn't a valid locale format`);
      return;
    }

    this.locale.next(locale);
    this._locale = locale;
  }

  /**
   * Get the currency symbol for the currently set locale.
   */
  getCurrencySymbol(locale = this.getLocale()) {
    const currency = this.localeCurrencyMapping[locale];
    const numberFormat = new Intl.NumberFormat(locale, {
      style: 'currency',
      currencyDisplay: 'symbol',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const pivot = 0;

    return numberFormat
      .format(pivot)
      .split(pivot.toString())
      .map((element) => element.trim())
      .find((element) => !!element);
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
  localizeDate(
    date: ValidDate,
    locale: Locale = this.getLocale(),
    options: DateFormatOptions = {},
  ): string {
    const resolved =
      options ?? getDefaultOptions(locale, 'date', this.localeConfig);

    return this.dateTransformer.transform(toDate(date), locale, resolved);
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
    style: NumberStyles,
    locale: Locale = this.getLocale(),
    options?: Intl.NumberFormatOptions,
  ): string {
    let resolved =
      options ?? getDefaultOptions(locale, style, this.localeConfig);

    if (style === 'currency') {
      resolved = {
        ...resolved,
        currency: resolved.currency || this._resolveCurrencyCode(locale),
      };
    }

    return this.numberTransformer.transform(value, style, locale, resolved);
  }

  /**
   * @internal
   */
  _resolveCurrencyCode(locale: Locale = this.getLocale()) {
    return this.localeCurrencyMapping[locale] || this.defaultCurrency;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Caretaker note: it's important to clean up references to subscriptions since they save the `next`
    // callback within its `destination` property, preventing classes from being GC'd.
    this.subscription = null;
  }

  private toLocale(val: string | Locale): Locale {
    if (this.langLocaleMapping[val]) {
      return this.langLocaleMapping[val];
    }

    if (isLocaleFormat(val)) {
      return val;
    }

    return '';
  }

  private initializeLocale(): Locale {
    const browserLocale = this.toLocale(this.browserLocale);
    if (browserLocale) return browserLocale;

    const defaultLocaleResolved = this.toLocale(this.defaultLocale);
    if (defaultLocaleResolved) return defaultLocaleResolved;

    const activeLang = this.translocoService.getActiveLang();
    if (activeLang) {
      const locale = this.toLocale(activeLang);
      if (locale) return locale;
    }

    return 'en-US'; // Fallback to a default locale
  }
}
