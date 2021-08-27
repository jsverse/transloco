import { isBrowser } from './helpers';

/**
 * Returns the language code name from the browser, e.g. "en"
 */
export function getBrowserLang(): string | undefined {
  let browserLang = getBrowserCultureLang();
  if (!browserLang || !isBrowser()) {
    return undefined;
  }

  if (browserLang.indexOf('-') !== -1) {
    browserLang = browserLang.split('-')[0];
  }

  if (browserLang.indexOf('_') !== -1) {
    browserLang = browserLang.split('_')[0];
  }

  return browserLang;
}

/**
 * Returns the culture language code name from the browser, e.g. "en-US"
 */
export function getBrowserCultureLang(): string {
  if (!isBrowser()) {
    return '';
  }

  const navigator = window.navigator as any;
  let browserCultureLang = navigator.languages ? navigator.languages[0] : null;
  browserCultureLang =
    browserCultureLang ||
    navigator.language ||
    navigator.browserLanguage ||
    navigator.userLanguage;

  return browserCultureLang;
}
