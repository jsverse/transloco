import { TRANSLOCO_LOADER } from '@ngneat/transloco';

export function WebpackLoader() {
  return function(lang: string) {
    // need to check whether webpack includes each chunk in the main bundle
    return import(`../assets/langs/${lang}.json`);
  };
}

export const webpackLoader = { provide: TRANSLOCO_LOADER, useFactory: WebpackLoader };
