export function getLangFn({ cachedLang, browserLang, cultureLang, defaultLang }) {
  return cachedLang || defaultLang;
}
