import { GetLangParams } from '@ngneat/transloco-persist-lang';

export function getLangFn({ cachedLang, defaultLang }: GetLangParams): string {
  return cachedLang || defaultLang;
}
