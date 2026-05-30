export function isBrowser() {
  // Prefer `ngServerMode` (Angular v17+) for SSR detection, falling back to checking `window` for
  // older Angular versions and MFE scenarios where `ngServerMode` may not be available.
  // This lets bundlers tree-shake the `window` check when `ngServerMode` is always defined.
  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    return false;
  } else {
    return typeof window !== 'undefined';
  }
}

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
  // See SSR guard in `isBrowser`. When `ngServerMode` is defined, bundlers can inline
  // the `isBrowser()` result as `false`, eliminating the runtime call entirely.
  if ((typeof ngServerMode !== 'undefined' && ngServerMode) || !isBrowser()) {
    return '';
  }

  const navigator = window.navigator;

  return navigator.languages?.[0] ?? navigator.language;
}
