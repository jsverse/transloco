import { GetLangParams } from '@jsverse/transloco-persist-lang';

export function getLangFn({ cachedLang, defaultLang }: GetLangParams): string {
  return cachedLang || defaultLang;
}
