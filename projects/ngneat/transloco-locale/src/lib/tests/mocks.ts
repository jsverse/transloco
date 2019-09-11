import { of } from 'rxjs';
import LANG_LOCALE from '../lang-locale.json';
import LOCALE_CURRENCY from '../locale-currency.json';
import { Locale } from '../transloco-locale.types';
import createSpy = jasmine.createSpy;

export function createFakeService(locale: Locale = 'en-US') {
  return {
    getLocale: createSpy().and.callFake(() => locale),
    localeChanges$: of(locale)
  };
}

export function createFakeCDR(locale: string = 'en-US') {
  return {
    markForCheck: createSpy()
  };
}

export const LOCALE_CURRENCY_MOCK = LOCALE_CURRENCY;
export const LANG_LOCALE_MOCK = LANG_LOCALE;
